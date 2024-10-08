import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box, Button, TextField, Paper, Grid } from '@mui/material';

function CustomerLoginPage() {
  const navigate = useNavigate();

  // State to manage form data
  const [formData, setFormData] = useState({
    email: '',
    customerId: '' // Ensure customerId is treated as a string
  });

  // State for form validation errors
  const [errors, setErrors] = useState({
    email: '',
    customerId: ''
  });

  // State to hold the account numbers array
  const [accountNumbers, setAccountNumbers] = useState([]);

  // State for form submission error
  const [submissionError, setSubmissionError] = useState('');

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' }); // Reset error on change
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate customer ID format (string, can be alphanumeric if required)
  const validateCustomerId = (customerId) => {
    return /^[a-zA-Z0-9]+$/.test(customerId); // Allow alphanumeric customer IDs
  };

  // Function to mask the account number
  const maskAccountNumber = (accountNumber) => {
    if (accountNumber.length <= 4) return accountNumber; // Edge case for very short account numbers
    const firstTwo = accountNumber.slice(0, 2);
    const lastTwo = accountNumber.slice(-2);
    const maskedMiddle = 'X'.repeat(accountNumber.length - 4);
    return `${firstTwo}${maskedMiddle}${lastTwo}`;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation
    let hasError = false;
    let newErrors = { email: '', customerId: '' };

    if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email format';
      hasError = true;
    }

    if (!validateCustomerId(formData.customerId)) {
      newErrors.customerId = 'Customer ID must be alphanumeric';
      hasError = true;
    }

    setErrors(newErrors);

    if (!hasError) {
      // Proceed with API call to fetch data from Firestore using email as the document ID
      try {
        const url = `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${formData.email}`;

        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (response.ok && data.fields) {
          const customerData = data.fields;

          // Check if the customerId from the document matches the input
          if (customerData.customerID.stringValue === formData.customerId) {
            // Store email and customerId in local storage
            localStorage.setItem('email', formData.email);
            localStorage.setItem('customerId', formData.customerId);

            // If customerId matches, fetch the account numbers from the details array
            if (customerData.details.arrayValue && customerData.details.arrayValue.values) {
              const detailsArray = customerData.details.arrayValue.values;
              const accountNumbers = detailsArray.map(detail => detail.mapValue.fields.accountNumber.stringValue);

              // Set the account numbers as an array for rendering as hyperlinks
              setAccountNumbers(accountNumbers);
              setSubmissionError('');
            } else {
              setSubmissionError('No account details found for the provided customer.');
              setAccountNumbers([]);
            }
          } else {
            setSubmissionError('Customer ID does not match the provided email.');
            setAccountNumbers([]);
          }
        } else {
          setSubmissionError('No customer found with the provided email.');
          setAccountNumbers([]);
        }
      } catch (error) {
        setSubmissionError('An error occurred while fetching data.');
        setAccountNumbers([]);
      }
    }
  };

  const handleAccountClick = (accountNumber) => {
    // Navigate to the CommonLoginPage with accountNumber as state
    navigate('/commonLoginPage', { state: { accountNumber } });
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Paper elevation={3} sx={{ padding: '40px', textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Customer Login
        </Typography>
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* Email Input */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                name="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                required
              />
            </Grid>

            {/* Customer ID Input */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer ID"
                name="customerId"
                variant="outlined"
                value={formData.customerId}
                onChange={handleChange}
                error={!!errors.customerId}
                helperText={errors.customerId}
                required
              />
            </Grid>
          </Grid>

          {/* Submit Button */}
          <Box mt={4}>
            <Button type="submit" variant="contained" color="primary" size="large" fullWidth>
              Login
            </Button>
          </Box>
        </form>

        {/* Display account numbers as masked hyperlinks or error */}
        {submissionError && <Typography color="error">{submissionError}</Typography>}
        {accountNumbers.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6">
              Your accounts:
            </Typography>
            <Box>
              {accountNumbers.map((accountNumber, index) => (
                <Typography key={index} variant="body1">
                  <Button 
                    onClick={() => handleAccountClick(accountNumber)} 
                    variant="text" 
                    style={{ textDecoration: 'none', color: 'blue' }}>
                    {maskAccountNumber(accountNumber)}
                  </Button>
                </Typography>
              ))}
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default CustomerLoginPage;
