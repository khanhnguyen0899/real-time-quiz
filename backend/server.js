const express = require('express'); // Import Express framework
const http = require('http'); // Import HTTP module to create a server
const socketIo = require('socket.io'); // Import Socket.io for real-time communication
const cors = require('cors'); // Import CORS middleware to allow cross-origin requests
const { MongoClient } = require('mongodb'); // Import MongoDB client
const config = require('./config'); // Import configuration for MongoDB connection

const app = express(); // Create an Express application
const server = http.createServer(app); // Create an HTTP server
const io = socketIo(server, { // Initialize Socket.io with the server
  cors: {
    origin: "http://localhost:3000", // Allow requests from the frontend (React app)
    methods: ["GET", "POST"],
  },
});

app.use(cors()); // Use CORS middleware
app.use(express.json()); // Use middleware to parse JSON bodies

let db;
MongoClient.connect(config.mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    db = client.db(); // Connect to MongoDB and get the database
    console.log('Connected to MongoDB');
  })
  .catch(error => console.error('Failed to connect to MongoDB:', error)); // Log any connection errors

// Endpoint to join a quiz
app.post('/join-quiz', async (req, res) => {
  const { userId, quizId } = req.body; // Extract userId and quizId from the request body
  const quizCollection = db.collection('quizzes'); // Get the quizzes collection from MongoDB
  const quiz = await quizCollection.findOne({ quizId }); // Find the quiz with the given quizId

  if (!quiz) {
    // If the quiz does not exist, create a new quiz document
    await quizCollection.insertOne({ quizId, users: [userId], leaderboard: [] });
  } else {
    // If the quiz exists, add the user to the users array
    await quizCollection.updateOne({ quizId }, { $addToSet: { users: userId } });
  }

  res.send({ message: 'Joined quiz successfully' }); // Send a success response
});

// Endpoint to get the number of users in a quiz session
app.get('/quiz-users/:quizId', async (req, res) => {
  const { quizId } = req.params; // Extract quizId from the request parameters
  const quizCollection = db.collection('quizzes'); // Get the quizzes collection from MongoDB
  const quiz = await quizCollection.findOne({ quizId }); // Find the quiz with the given quizId

  if (quiz) {
    res.send({ quizId, userCount: quiz.users.length, users: quiz.users }); // Send the number of users and user list
  } else {
    res.status(404).send({ message: 'Quiz not found' }); // Send a 404 response if the quiz is not found
  }
});

// Handle WebSocket connections
io.on('connection', (socket) => {
  console.log('User connected');

  // Handle a user joining a quiz
  socket.on('joinQuiz', async (data) => {
    const { userId, quizId } = data; // Extract userId and quizId from the data
    socket.join(quizId); // Join the user to a room identified by the quizId
    const quizCollection = db.collection('quizzes');
    await quizCollection.updateOne({ quizId }, { $addToSet: { users: userId } }); // Add the user to the quiz
    io.to(quizId).emit('userJoined', { userId }); // Notify all users in the quiz room that a new user has joined
  });

  // Handle a user submitting an answer
  socket.on('submitAnswer', async (data) => {
    const { userId, quizId, answer } = data; // Extract userId, quizId, and answer from the data
    const score = Math.random() * 100; // Mock scoring logic: generate a random score
    const quizCollection = db.collection('quizzes');
    await quizCollection.updateOne(
      { quizId },
      { $push: { leaderboard: { userId, score } } } // Update the leaderboard with the new score
    );
    const quiz = await quizCollection.findOne({ quizId }); // Get the updated quiz document
    io.to(quizId).emit('leaderboardUpdate', quiz.leaderboard); // Send the updated leaderboard to all users in the quiz room
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 4000; // Define the port on which the server will listen
server.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});