import React from 'react';
import { useNavigate } from 'react-router-dom'; // If you're using React Router for navigation

function AdminOperations() {
  const navigate = useNavigate(); // Used to navigate between routes

  const handleLoginRequest = () => {
    // Redirect or handle Login Request action
    navigate('/adminlogin'); // Assumes you have a route set up for login requests
  };

  const handleLoanRequest = () => {
    // Redirect or handle Loan Request action
    navigate('/loan-requests'); // Assumes you have a route set up for loan requests
  };

  return (
    <div style={styles.container}>
      <h1>Admin Operations</h1>
      <div style={styles.buttonContainer}>
        <button style={styles.button} onClick={handleLoginRequest}>Login Request</button>
        <button style={styles.button} onClick={handleLoanRequest}>Loan Request</button>
        {/* Add more buttons for other admin actions if needed */}
      </div>
    </div>
  );
}

// Basic styling for the container and buttons
const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '50px',
  },
  buttonContainer: {
    display: 'flex',
    gap: '20px',
    marginTop: '20px',
  },
  button: {
    backgroundColor: '#4CAF50', // Green background
    border: 'none',
    color: 'white',
    padding: '15px 32px',
    textAlign: 'center',
    textDecoration: 'none',
    display: 'inline-block',
    fontSize: '16px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};

export default AdminOperations;
