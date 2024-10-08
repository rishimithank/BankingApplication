import React, { useEffect, useState } from 'react';
import { Container, Typography, TextField, Button, Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

function CommonLoginPage() {
  const email = localStorage.getItem('email');
  const customerId = localStorage.getItem('customerId');
  const navigate = useNavigate(); // Initialize navigate
  const location = useLocation();
  const { accountNumber } = location.state || {};

  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [accountDetails, setAccountDetails] = useState(null);
  
  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password === '') {
      setError('Password is required.');
      return;
    }

    // Validate password after checking if account details exist
    if (accountDetails) {
      const storedPassword = accountDetails.password?.stringValue; // Safely access password

      if (storedPassword === password) {
        // Navigate to AccountDetailsPage with account details
        navigate('/account-details', { state: { accountDetails } });
      } else {
        setError('Incorrect password.');
      }
    } else {
      setError('Account details not found. Please try again.');
    }
  };

  useEffect(() => {
    const fetchCustomerData = async () => {
      try {
        // Fetch customer data from Firestore using email
        const url = `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}`;
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch customer data');
        }

        const data = await response.json();

        if (data.fields) {
          const customerData = data.fields;

          // Check if customerId matches
          if (customerData.customerID.stringValue !== customerId) {
            setError('Customer ID does not match.');
            return;
          }

          // Check for account number in details
          if (customerData.details.arrayValue && customerData.details.arrayValue.values) {
            const detailsArray = customerData.details.arrayValue.values;

            // Find matching account number in details array
            const matchingAccount = detailsArray.find(detail =>
              detail.mapValue.fields.accountNumber.stringValue === accountNumber
            );

            if (matchingAccount) {
              // If a matching account number is found, set the account details
              setAccountDetails(matchingAccount.mapValue.fields);
            } else {
              setError('Account number not found.');
            }
          } else {
            setError('No account details found.');
          }
        } else {
          setError('No customer found with the provided email.');
        }
      } catch (error) {
        setError('An error occurred while fetching customer data.');
      }
    };

    fetchCustomerData();
  }, [email, customerId, accountNumber]);

  // Function to filter out sensitive information
  const filterSensitiveData = (details) => {
    const { password, aadharCard, panCard, ...filteredDetails } = details;
    return filteredDetails;
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Typography variant="h4" gutterBottom>
        Enter Password for Account: {accountNumber}
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Password"
          type="password"
          variant="outlined"
          value={password}
          onChange={handlePasswordChange}
          error={!!error}
          helperText={error}
          required
        />
        <Box mt={4}>
          <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
            Login
          </Button>
        </Box>
      </form>
    </Container>
  );
}

export default CommonLoginPage;
