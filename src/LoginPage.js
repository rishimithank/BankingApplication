import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Container, Typography, Box, Grid, Paper, Modal, TextField, IconButton, AppBar, Toolbar } from '@mui/material';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import SavingsIcon from '@mui/icons-material/Savings';
import TransferWithinAStationIcon from '@mui/icons-material/TransferWithinAStation';
import SecurityIcon from '@mui/icons-material/Security';
import CloseIcon from '@mui/icons-material/Close';

function LoginPage() {
  const navigate = useNavigate();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // State for opening and closing the Sign In Modal
  const [open, setOpen] = useState(false);

  // State to store form data
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    Balance: '',
    aadharCard: '',
    panCard: '',
  });

  // Handle Modal Open/Close
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Handle form input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle file change for Aadhar Card and PAN Card
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prevData) => ({
        ...prevData,
        [name]: reader.result, // Base64 string
      }));
    };
    if (file) {
      reader.readAsDataURL(file); // Read file as Base64
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate that Amount Limit is at least 100,000
    if (parseInt(formData.Balance, 10) < 100000) {
      alert('Amount limit must be at least INR 100,000');
      return;
    }

    if (!emailRegex.test(formData.email)) {
      alert('Please enter a valid email address.');
      return;
    }
    
    // Validate that both Aadhar Card and PAN Card are uploaded
    if (!formData.aadharCard) {
      alert('Please upload your Aadhar Card');
      return;
    }

    if (!formData.panCard) {
      alert('Please upload your PAN Card');
      return;
    }

    // Create a new document in Firestore with customer ID as ID
    const accountNumber = Date.now().toString(); // Example for generating unique customer ID

    // Prepare the data to be sent
    const data = {
      fields: {
        fullName: { stringValue: formData.fullName },
        email: { stringValue: formData.email },
        password: { stringValue: formData.password },
        Balance: { integerValue: parseInt(formData.Balance, 10) },
        aadharCard: { stringValue: formData.aadharCard }, // Base64 string
        panCard: { stringValue: formData.panCard }, // Base64 string
        accountNumber: { stringValue: accountNumber },
      },
    };

    // Sending the data to Firestore
    try {
      const response = await fetch(`https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/AdminLoginRequest/${accountNumber}`, {
        method: 'PATCH', // Use POST for creating a new document
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        alert('Account created successfully!');
        handleClose(); // Close modal after submission
      } else {
        const errorResponse = await response.json();
        console.error("Error adding document: ", errorResponse);
        alert('Error creating account. Please try again.');
      }
    } catch (error) {
      console.error("Network Error: ", error);
      alert('Error creating account. Please check your network and try again.');
    }
  };

  // Handle Login button click
  const handleLogin = () => {
    // Navigate to the Customer Details Form
    navigate('/customer-form');
  };

  // Handle Admin button click
  const handleAdminClick = () => {
    navigate('/admin'); // Replace with the actual route to the admin page
  };

  return (
    <>
      {/* AppBar with Admin Button */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            TrustedBank
          </Typography>
          {/* Admin Button in Header */}
          <Button color="inherit" onClick={handleAdminClick}>
            Admin
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" style={{ textAlign: 'center', marginTop: '50px', padding: '20px' }}>
        {/* Welcome Section */}
        <Typography variant="h2" gutterBottom>
          Welcome to TrustedBank
        </Typography>
        <Typography variant="h6" color="textSecondary" paragraph>
          Your trusted partner for all financial needs. Login to manage your accounts, transfer money, apply for loans, and more.
        </Typography>

        {/* Banking Features Grid */}
        <Grid container spacing={4} style={{ marginTop: '40px' }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <AccountBalanceIcon style={{ fontSize: 60, color: '#1976d2' }} />
              <Typography variant="h6" style={{ marginTop: '10px' }}>
                Account Management
              </Typography>
              <Typography color="textSecondary">
                Easily manage your savings and checking accounts with full control over your funds.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <SavingsIcon style={{ fontSize: 60, color: '#4caf50' }} />
              <Typography variant="h6" style={{ marginTop: '10px' }}>
                Savings Plans
              </Typography>
              <Typography color="textSecondary">
                Explore various savings plans to grow your wealth over time.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <TransferWithinAStationIcon style={{ fontSize: 60, color: '#f57c00' }} />
              <Typography variant="h6" style={{ marginTop: '10px' }}>
                Money Transfers
              </Typography>
              <Typography color="textSecondary">
                Transfer money between accounts with ease and secure transactions.
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper elevation={3} style={{ padding: '20px' }}>
              <SecurityIcon style={{ fontSize: 60, color: '#d32f2f' }} />
              <Typography variant="h6" style={{ marginTop: '10px' }}>
                Secure Banking
              </Typography>
              <Typography color="textSecondary">
                Your account is protected with top-tier security measures to ensure safe banking.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Buttons Section */}
        <Box mt={6}>
          {/* Login Button */}
          <Button variant="contained" color="primary" size="large" onClick={handleLogin} style={{ marginRight: '20px' }}>
            Login
          </Button>

          {/* Sign In Button */}
          <Button variant="outlined" color="secondary" size="large" onClick={handleOpen}>
            Sign In
          </Button>
        </Box>

        {/* Sign In Modal */}
        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 400,
              bgcolor: 'background.paper',
              borderRadius: '10px',
              boxShadow: 24,
              p: 4,
            }}
          >
            <IconButton
              aria-label="close"
              onClick={handleClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: (theme) => theme.palette.grey[500],
              }}
            >
              <CloseIcon />
            </IconButton>

            {/* Sign In Form */}
            <Typography variant="h5" component="h2" gutterBottom>
              Create an Account
            </Typography>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                margin="normal"
                label="Full Name"
                name="fullName"
                variant="outlined"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Email"
                name="email"
                variant="outlined"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Password"
                name="password"
                type="password"
                variant="outlined"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <TextField
                fullWidth
                margin="normal"
                label="Initial Balance (INR)"
                name="Balance"
                type="number"
                variant="outlined"
                value={formData.Balance}
                onChange={handleChange}
                required
              />
              <Typography variant="subtitle1" sx={{ marginTop: '15px' }}>
                Upload Aadhar Card (PDF):
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                name="aadharCard"
                type="file"
                inputProps={{ accept: 'application/pdf' }}
                onChange={handleFileChange}
                required
              />
              <Typography variant="subtitle1" sx={{ marginTop: '15px' }}>
                Upload PAN Card (PDF):
              </Typography>
              <TextField
                fullWidth
                margin="normal"
                name="panCard"
                type="file"
                inputProps={{ accept: 'application/pdf' }}
                onChange={handleFileChange}
                required
              />
              <Button variant="contained" color="primary" type="submit" fullWidth sx={{ marginTop: '20px' }}>
                Submit
              </Button>
            </form>
          </Box>
        </Modal>
      </Container>
    </>
  );
}

export default LoginPage;
