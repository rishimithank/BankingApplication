import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Assuming you're using React Router
import './AdminPage.css'; // Import external CSS file for styling

function AdminPage() {
  const [customerID, setCustomerID] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    // Replace with your Firestore API URL
    const url = 'https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/Admin';

    try {
      const response = await fetch(url);
      const data = await response.json();

      // Check if the document exists and validate the credentials
      const adminData = data.documents.find((doc) => {
        const fields = doc.fields;
        return (
          fields.customerID.stringValue === customerID && 
          fields.password.stringValue === password
        );
      });

      if (adminData) {
        // Login successful, redirect or show a message
        setError('');
        console.log('Login successful');
        navigate('/adminOperations'); // Assuming you have a route for the dashboard
      } else {
        // Login failed
        setError('Invalid CustomerID or Password.');
      }
    } catch (error) {
      console.error('Error during login:', error);
      setError('An error occurred while logging in. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h2 className="login-title">Admin Login</h2>
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Customer ID:</label>
            <input
              type="text"
              value={customerID}
              onChange={(e) => setCustomerID(e.target.value)}
              required
            />
          </div>
          <div className="input-group">
            <label>Password:</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="login-button">Login</button>
        </form>
      </div>
    </div>
  );
}

export default AdminPage;
