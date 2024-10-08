import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  CircularProgress,
  Button,
} from '@mui/material';

const LOAN_REQUESTS_URL = 'https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/AdminLoanRequest';

function LoanRequestsPage() {
  const [loanRequests, setLoanRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLoanRequests = async () => {
      try {
        const response = await fetch(LOAN_REQUESTS_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          const errorResponse = await response.json();
          throw new Error(`Error: ${response.statusText} - ${JSON.stringify(errorResponse)}`);
        }

        const data = await response.json();
        if (!data.documents || data.documents.length === 0) {
          setLoanRequests([]); // No loan requests found
        } else {
          // Map the data to a simpler structure
          const requests = data.documents.map((doc) => {
            const { fields } = doc;

            return {
              id: doc.name.split('/').pop(), // Extract document ID from the name
              loanAmount: fields.loanAmount.integerValue,
              Colletral: fields.Colletral.stringValue,
              timestamp: fields.timestamp.timestampValue,
              email: fields.email.stringValue,
              customerID: fields.customerId.stringValue,
              accountDetails: {
                Balance: fields.accountDetails.mapValue.fields.Balance.doubleValue,
                accountNumber: fields.accountDetails.mapValue.fields.accountNumber.stringValue,
                fullName: fields.accountDetails.mapValue.fields.fullName.stringValue,
              },
            };
          });
          setLoanRequests(requests); // Store loan requests data
        }
      } catch (err) {
        console.error('Error fetching loan requests:', err);
        setError('Error fetching loan requests: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanRequests();
  }, []);

  // Function to handle the accept button click and print email and account number
  const CUSTOMER_COLLECTION_URL = 'https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer';

  const handleAccept = async (request) => {
    try {
      const customerEmail = request.email;
  
      // Step 1: Append email to the customer URL (assuming email is the document ID)
      const encodedEmail = encodeURIComponent(customerEmail); // Encode email to handle special characters
      const customerUrl = `${CUSTOMER_COLLECTION_URL}/${encodedEmail}`; // Assuming email is the document ID
  
      // Fetch the existing document
      const customerResponse = await fetch(customerUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      if (!customerResponse.ok) {
        const errorResponse = await customerResponse.json();
        throw new Error(`Error: ${customerResponse.statusText} - ${JSON.stringify(errorResponse)}`);
      }
  
      const customerDoc = await customerResponse.json();
  
      // Step 2: Look for the accountNumber in the details array
      const customerDetails = customerDoc.fields.details.arrayValue.values;
  
      // Traverse the details array to find the accountNumber and update the Balance
      const updatedDetails = customerDetails.map((detail) => {
        if (detail.mapValue.fields.accountNumber.stringValue === request.accountDetails.accountNumber) {
          // Add the loan amount to the Balance
          const currentBalance = parseFloat(detail.mapValue.fields.Balance.doubleValue);
          const updatedBalance = currentBalance + parseFloat(request.loanAmount);
  
          // Return updated account details
          return {
            ...detail,
            mapValue: {
              fields: {
                ...detail.mapValue.fields,
                Balance: {
                  doubleValue: updatedBalance, // Update the balance here
                },
              },
            },
          };
        }
        return detail; // Keep other account details unchanged
      });
  
      // Step 3: Prepare the update body (only update details array)
      const updateBody = {
        fields: {
          details: {
            arrayValue: {
              values: updatedDetails, // Update only the details array
            },
          },
          // Include other fields to ensure they are preserved
          customerID: {
            stringValue: customerDoc.fields.customerID.stringValue, // Preserve the customerId
          },
          // Add any other fields you need to preserve here
        },
      };
  
      // Step 4: Send the updated customer document back to Firestore (PATCH request to modify details only)
      const updateResponse = await fetch(customerUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateBody),
      });
  
      if (!updateResponse.ok) {
        const errorResponse = await updateResponse.json();
        throw new Error(`Error updating customer balance: ${updateResponse.statusText} - ${JSON.stringify(errorResponse)}`);
      }
  
      console.log('Customer balance updated successfully.');
  
      // Step 5: Now delete the loan request from the AdminLoanRequest collection
      await handleReject(request.id);
  
    } catch (err) {
      console.error('Error updating customer balance and deleting loan request:', err);
    }
  };
  
  const handleReject = async (requestId) => {
    try {
      const deleteResponse = await fetch(`${LOAN_REQUESTS_URL}/${requestId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
      });

      if (!deleteResponse.ok) {
        const errorResponse = await deleteResponse.json();
        throw new Error(`Error: ${deleteResponse.statusText} - ${JSON.stringify(errorResponse)}`);
      }

      // Remove the deleted request from local state
      setLoanRequests((prevRequests) => prevRequests.filter((request) => request.id !== requestId));
      console.log(`Loan Request ${requestId} rejected and deleted.`);
    } catch (err) {
      console.error('Error deleting loan request:', err);
      setError('Error deleting loan request: ' + err.message);
    }
  };

  return (
    <Container maxWidth={false} sx={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', position: 'absolute', top: 0, left: 0, padding: 2 }}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Typography variant="h6" color="error">
          {error}
        </Typography>
      ) : loanRequests.length === 0 ? (
        <Typography variant="h6" color="textSecondary" align="center">
          No Loan Requests
        </Typography>
      ) : (
        loanRequests.map((request) => (
          <Paper key={request.id} elevation={3} sx={{ padding: 2, mb: 2 }}>
            <Box sx={{ mb: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Loan Amount: {request.loanAmount}
              </Typography>
              <Typography variant="body1">Collateral:</Typography>
              {request.Colletral && (
                <img
                  src={`data:image/jpeg;base64,${request.Colletral}`}
                  alt="Collateral"
                  style={{ maxWidth: '100%', maxHeight: '200px', display: 'block', margin: '10px 0' }}
                />
              )}
              <Typography variant="body2" color="textSecondary">
                Timestamp: {new Date(request.timestamp).toLocaleString()}
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1">
                  Account Number: {request.accountDetails.accountNumber}
                </Typography>
                <Typography variant="body1">
                  Full Name: {request.accountDetails.fullName}
                </Typography>
                <Typography variant="body1">
                  Balance: {request.accountDetails.Balance}
                </Typography>
                <Typography variant="body1">
                  Email: {request.email}
                </Typography>
                <Typography variant="body1">
                  CustomerID: {request.customerID}
                </Typography>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button variant="contained" color="primary" onClick={() => handleAccept(request)}>
                  Accept
                </Button>
                <Button variant="outlined" color="secondary" onClick={() => handleReject(request.id)}>
                  Reject
                </Button>
              </Box>
            </Box>
          </Paper>
        ))
      )}
    </Container>
  );
}

export default LoanRequestsPage;



