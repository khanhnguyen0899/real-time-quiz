import React from 'react'; // Import React
import ReactDOM from 'react-dom'; // Import ReactDOM for rendering
import './index.css'; // Import CSS for styling
import App from './App'; // Import the App component

ReactDOM.render(
  <React.StrictMode>
    <App /> {/* Render the App component */}
  </React.StrictMode>,
  document.getElementById('root') // Mount the App component to the DOM element with id 'root'
);
