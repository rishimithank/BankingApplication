import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  AppBar,
  Toolbar,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

function AccountDetailsPage() {
  const email = localStorage.getItem('email');
  const customerId = localStorage.getItem('customerId');
  const location = useLocation();
  const accountDetails = location.state?.accountDetails || {};
 
  const navigate = useNavigate(); // useNavigate hook for navigation

  const filterSensitiveData = (details) => {
    const { aadharCard, panCard, password, ...filteredDetails } = details;
    return filteredDetails;
  };

  const filteredAccountDetails = filterSensitiveData(accountDetails);

  const [open, setOpen] = useState(false);
  const [loanAmount, setLoanAmount] = useState('');
  const [base64Document, setBase64Document] = useState(null); // Store Base64 document
  const [errorMessage, setErrorMessage] = useState('');

  const handleLoanRequestClick = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setLoanAmount('');
    setBase64Document(null);
    setErrorMessage('');
  };

  // Convert uploaded document to Base64
  const handleDocumentChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBase64Document(reader.result); // Set Base64 string
      };
      reader.readAsDataURL(file); // Read file as Base64
    }
  };

  const handleLoanSubmit = async () => {
    const amount = parseInt(loanAmount, 10);

    if (isNaN(amount) || amount <= 0 || amount > 10000000) {
      setErrorMessage('Please enter a valid loan amount (between 1 and 10,000,000)');
      return;
    }

    if (!base64Document) {
      setErrorMessage('Please upload a document.');
      return;
    }

    const payload = {
      fields: {
        loanAmount: { integerValue: amount },
        email: { stringValue: email },
        customerId: { stringValue: customerId },
        accountDetails: {
          mapValue: {
            fields: Object.keys(filteredAccountDetails).reduce((acc, key) => {
              const value = filteredAccountDetails[key];
              if (value.doubleValue) {
                acc[key] = { doubleValue: value.doubleValue };
              } else if (value.stringValue) {
                acc[key] = { stringValue: value.stringValue };
              } else {
                acc[key] = { stringValue: '' };
              }
              return acc;
            }, {}),
          },
        },
        Colletral: { stringValue: base64Document }, // Use Base64 string here
        timestamp: { timestampValue: new Date().toISOString() },
      },
    };

    try {
      const response = await fetch(
        'https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/AdminLoanRequest',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const responseData = await response.json();
      console.log('Response status:', response.status);
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(`Error: ${responseData.error?.message || 'Unknown error'}`);
      }

      alert('Loan request submitted successfully!');
      handleClose();
    } catch (error) {
      console.error('Error submitting loan request:', error);
      alert('Error submitting loan request: ' + error.message);
    }
  };

  // Handle navigation to transaction page
  const handleTransactionClick = () => {
    navigate('/transaction',{state:{accountDetails}}); // Replace with your transaction page route
  };

  return (
    <>
      <AppBar position="static" sx={{ backgroundColor: '#1976d2', mb: 4 }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Account Management
          </Typography>
          <Button color="inherit" sx={{ mr: 2 }} onClick={handleLoanRequestClick}>
            Loan Request
          </Button>
          <Button color="inherit" onClick={handleTransactionClick}>
            Transaction
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="sm" sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Account Details
          </Typography>
          {Object.entries(filteredAccountDetails).map(([key, value]) => (
            <Box key={key} sx={{ mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 'medium', color: '#424242' }}>
                {`${key.charAt(0).toUpperCase() + key.slice(1)}:`}
              </Typography>
              <Typography variant="body1" sx={{ color: '#616161' }}>
                {`${value.stringValue || value.integerValue || value.doubleValue || 'N/A'}`}
              </Typography>
            </Box>
          ))}
        </Paper>
      </Container>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Loan Request</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="loanAmount"
            label="Enter Loan Amount (max 10,000,000)"
            type="number"
            fullWidth
            variant="outlined"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
            error={!!errorMessage}
            helperText={errorMessage}
          />
          <input
            type="file"
            onChange={handleDocumentChange}
            accept="image/*,.pdf"
            style={{ marginTop: '15px' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleLoanSubmit} color="primary">
            Send
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default AccountDetailsPage;
