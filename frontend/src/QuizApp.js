import React, { useState, useEffect } from 'react'; // Import React and hooks
import io from 'socket.io-client'; // Import Socket.io client

const socket = io('http://localhost:4000'); // Connect to the backend server via Socket.io

const QuizApp = () => {
  const [quizId, setQuizId] = useState(''); // State for storing the quiz ID
  const [userId, setUserId] = useState(''); // State for storing the user ID
  const [leaderboard, setLeaderboard] = useState([]); // State for storing the leaderboard

  useEffect(() => {
    // Listen for leaderboard updates from the server
    socket.on('leaderboardUpdate', (data) => {
      setLeaderboard(data); // Update the leaderboard state
    });
  }, []);

  // Function to join a quiz
  const joinQuiz = async () => {
    // Send a POST request to the backend to join the quiz
    await fetch('http://localhost:4000/join-quiz', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId, quizId }), // Send userId and quizId in the request body
    });
    socket.emit('joinQuiz', { userId, quizId }); // Emit a joinQuiz event to the server
  };

  // Function to submit an answer
  const submitAnswer = () => {
    const answer = 'Answer'; // Replace with dynamic answer input
    socket.emit('submitAnswer', { userId, quizId, answer }); // Emit a submitAnswer event to the server
  };

  return (
    <div>
      <h1>Real-Time Quiz</h1>
      <input
        type="text"
        placeholder="Quiz ID"
        value={quizId}
        onChange={(e) => setQuizId(e.target.value)} // Update the quizId state when the input changes
      />
      <input
        type="text"
        placeholder="User ID"
        value={userId}
        onChange={(e) => setUserId(e.target.value)} // Update the userId state when the input changes
      />
      <button onClick={joinQuiz}>Join Quiz</button> {/* Button to join the quiz */}
      <button onClick={submitAnswer}>Submit Answer</button> {/* Button to submit an answer */}
      <h2>Leaderboard</h2>
      <ul>
        {leaderboard.map((entry, index) => (
          <li key={index}>{entry.userId}: {entry.score.toFixed(2)}</li> // Display the leaderboard
        ))}
      </ul>
    </div>
  );
};

export default QuizApp;