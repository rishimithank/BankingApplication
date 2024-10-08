import React, { useState } from 'react';
import { Container, Button, Typography, Paper, TextField, Box } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';

function TransactionPage() {
  const navigate = useNavigate();
  
  const Email = localStorage.getItem('email');
  //const customerId = localStorage.getItem('customerId');
  const location = useLocation();
  const accountDetails = location.state?.accountDetails || {};
  const senderBalance = accountDetails.Balance?.integerValue || accountDetails.Balance?.doubleValue ; // Use optional chaining to handle any undefined value
  const senderaccountNumber = accountDetails.accountNumber?.stringValue || '';
  localStorage.setItem("senderBalance",senderBalance);
  localStorage.setItem("accountNumber",senderaccountNumber);
  console.log(Email);
  console.log(senderBalance);

  const [isSameBank, setIsSameBank] = useState(false);
  const [email, setEmail] = useState('');
  const [customerID, setCustomerID] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [amount, setAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const handleSameBankTransfer = () => {
    setIsSameBank(true);  // Show the form for Same Bank Transfer
  };

  const handleOtherBankTransfer = () => {
    navigate("/commonTransfer",{state:{accountDetails}});
    // Add your logic for other bank transfer
  };

  const handleSubmit = async () => {
    
    // Validate input fields
    if (!email || !customerID || !accountNumber || !amount) {
      setErrorMessage('All fields are required.');
      return;
    }

    try {
      // Fetch recipient's customer document by email from Firestore
      const response = await fetch(
        `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}`
      );
      
      const customerData = await response.json();

      // Check if the recipient's customer document exists
      if (!response.ok || !customerData || !customerData.fields) {
        setErrorMessage('Customer with the provided email not found.');
        return;
      }

      // Check if customerID matches
      const dbCustomerID = customerData.fields.customerID?.stringValue;
      if (!dbCustomerID || dbCustomerID !== customerID) {
        setErrorMessage('CustomerID does not match.');
        return;
      }

      // Check if accountNumber exists in the recipient's 'details' array
      const detailsArray = customerData.fields.details?.arrayValue?.values;
      if (!detailsArray || detailsArray.length === 0) {
        setErrorMessage('No account details found.');
        return;
      }

      // Find the recipient's account in the 'details' array
      const account = detailsArray.find(
        (detail) =>
          detail.mapValue?.fields?.accountNumber?.stringValue === accountNumber
      );
      
      if (!account) {
        setErrorMessage('Account number not found.');
        return;
      }

      // Update the recipient's Balance
      const currentBalance = account.mapValue?.fields?.Balance?.doubleValue || 0;
      const newBalance = currentBalance + parseFloat(amount);
      const newSenderBalance = senderBalance - parseFloat(amount);

      if (newSenderBalance < 0) {
        setErrorMessage('Insufficient funds.');
        return;
      }

      // Update recipient's details array with the new balance
      const updatedRecipientDetails = detailsArray.map((detail) => {
        if (detail.mapValue?.fields?.accountNumber?.stringValue === accountNumber) {
          return {
            mapValue: {
              fields: {
                ...detail.mapValue.fields,
                Balance: { doubleValue: newBalance },
              },
            },
          };
        }
        return detail;
      });

      // Prepare the payload for updating recipient's Firestore document
      const recipientUpdatePayload = {
        fields: {
          details: {
            arrayValue: {
              values: updatedRecipientDetails,
            },
          },
        },
      };

      // Update the recipient's Firestore document
      const updateRecipientResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}?updateMask.fieldPaths=details`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(recipientUpdatePayload),
        }
      );

      if (!updateRecipientResponse.ok) {
        throw new Error('Failed to update recipient balance');
      }

      // Now, update the sender's balance
      // Fetch the sender's customer document by email from Firestore
      const senderResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${Email}`
      );

      const senderData = await senderResponse.json();

      if (!senderResponse.ok || !senderData || !senderData.fields) {
        setErrorMessage('Sender document not found.');
        return;
      }

      // Update the sender's details array
      const senderDetailsArray = senderData.fields.details?.arrayValue?.values || [];
      const updatedSenderDetails = senderDetailsArray.map((detail) => {
        if (detail.mapValue?.fields?.accountNumber?.stringValue === senderaccountNumber) {
          return {
            mapValue: {
              fields: {
                ...detail.mapValue.fields,
                Balance: { doubleValue: newSenderBalance }, // Update sender's balance
              },
            },
          };
        }
        return detail;
      });

      // Prepare the payload for updating sender's Firestore document
      const senderUpdatePayload = {
        fields: {
          details: {
            arrayValue: {
              values: updatedSenderDetails,
            },
          },
        },
      };

      // Update the sender's Firestore document
      const updateSenderResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${Email}?updateMask.fieldPaths=details`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(senderUpdatePayload),
        }
      );

      if (!updateSenderResponse.ok) {
        throw new Error('Failed to update sender balance');
      }

      alert('Transfer successful!');
      setIsSameBank(false);

    } catch (error) {
      setErrorMessage(`Error: ${error.message}`);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ padding: 4, borderRadius: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2', textAlign: 'center' }}>
          Transaction Options
        </Typography>

        {!isSameBank ? (
          <Box sx={{ textAlign: 'center' }}>
            <Button variant="contained" color="primary" onClick={handleSameBankTransfer} sx={{ mr: 2, mb: 2 }}>
              Same Bank Transfer
            </Button>
            <Button variant="contained" color="secondary" onClick={handleOtherBankTransfer} sx={{ mb: 2 }}>
              Other Bank Transfer
            </Button>
          </Box>
        ) : (
          <Box>
            <TextField
              label="Email ID"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <TextField
              label="Customer ID"
              fullWidth
              margin="normal"
              value={customerID}
              onChange={(e) => setCustomerID(e.target.value)}
            />
            <TextField
              label="Account Number"
              fullWidth
              margin="normal"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
            />
            <TextField
              label="Amount"
              fullWidth
              margin="normal"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
            {errorMessage && (
              <Typography color="error" sx={{ mt: 2 }}>
                {errorMessage}
              </Typography>
            )}
            <Button variant="contained" color="primary" fullWidth sx={{ mt: 2 }} onClick={handleSubmit}>
              Submit Transfer
            </Button>
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default TransactionPage;
