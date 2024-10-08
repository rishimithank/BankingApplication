import React, { useEffect, useState } from 'react';
import emailjs from 'emailjs-com'; // Import EmailJS

function AdminLoginRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const adminLoginRequestUrl = 'https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/AdminLoginRequest';
  const customerUrl = 'https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer';

  // Function to decode base64 strings
  const decodeBase64 = (base64String) => {
    try {
      return atob(base64String);
    } catch (e) {
      console.error('Failed to decode base64:', e);
      return '';
    }
  };

  // Fetch data when the component is mounted
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(adminLoginRequestUrl);
        const data = await response.json();
        if (data.documents) {
          const formattedData = data.documents.map((doc) => {
            const fields = doc.fields;
            return {
              id: doc.name.split('/').pop(), // Extract document ID
              Balance: fields.Balance.doubleValue || fields.Balance.integerValue,
              aadharCard: fields.aadharCard.stringValue,
              accountNumber: fields.accountNumber.stringValue,
              email: fields.email.stringValue,
              fullName: fields.fullName.stringValue,
              panCard: fields.panCard.stringValue,
              password: fields.password.stringValue,
            };
          });
          setRequests(formattedData);
        } else {
          setError('No requests found.');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error fetching data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Function to handle accepting a request
  const handleAccept = async (request) => {
    try {
      const customerID = Math.floor(100000 + Math.random() * 900000).toString(); // Generate a random customer ID
      const customerDocUrl = `${customerUrl}/${request.email}`; // Use email as document ID

      // Fetch the existing document to check if it already exists
      const existingCustomer = await fetch(customerDocUrl);
      
      if (existingCustomer.ok) {
        const customerData = await existingCustomer.json();
        
        // Extract existing details if present
        const existingDetails = customerData.fields.details
          ? customerData.fields.details.arrayValue.values || []
          : [];

        // Create a new customer details object
        const newCustomerDetails = {
          mapValue: {
            fields: {
              Balance: { doubleValue: request.Balance },
              aadharCard: { stringValue: request.aadharCard },
              accountNumber: { stringValue: request.accountNumber },
              fullName: { stringValue: request.fullName },
              panCard: { stringValue: request.panCard },
              password: { stringValue: request.password },
            }
          }
        };

        // Append the new details to the existing details array
        const updatedDetailsArray = [...existingDetails, newCustomerDetails];

        // PATCH request to update Firestore document
        const updateCustomer = await fetch(customerDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fields: {
              customerID: customerData.fields.customerID,  // Keep customerID intact
              details: { arrayValue: { values: updatedDetailsArray } }
            }
          })
        });

        if (!updateCustomer.ok) {
          const errorText = await updateCustomer.text(); // Get the error message
          throw new Error(`Failed to update existing customer details: ${errorText}`);
        }

        alert('Request accepted and new details appended to existing customer record.');
      } else {
        // If document does not exist, create a new one with the email as document ID
        const newCustomerDetails = {
          fields: {
            customerID: { stringValue: customerID }, // Create new customerID
            details: {
              arrayValue: {
                values: [
                  {
                    mapValue: {
                      fields: {
                        Balance: { doubleValue: request.Balance },
                        aadharCard: { stringValue: request.aadharCard },
                        accountNumber: { stringValue: request.accountNumber },
                        fullName: { stringValue: request.fullName },
                        panCard: { stringValue: request.panCard },
                        password: { stringValue: request.password },
                      }
                    }
                  }
                ]
              }
            }
          }
        };

        const addToCustomer = await fetch(customerDocUrl, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newCustomerDetails),
        });

        if (!addToCustomer.ok) {
          const errorText = await addToCustomer.text(); // Get the error message
          throw new Error(`Failed to create a new customer record: ${errorText}`);
        }

        alert('Request accepted and new customer record created.');
      }

      // Send email notification
      await sendEmail(request.email, request.accountNumber, customerID);

      await deleteRequest(request.id);

    } catch (err) {
      console.error('Error accepting request:', err);
      alert(`Error accepting request: ${err.message}`);
    }
  };

  // Function to send email
  const sendEmail = (email, accountNumber, customerID) => {
    const templateParams = {
      to_email: email,
      accountNumber: accountNumber,
      customerID: customerID
    };

    return emailjs.send('service_gw79zu9', 'template_0m0r16p', templateParams, 'Uj1SoBSaLeLRGWzPz')
      .then((response) => {
        console.log('Email sent successfully!', response.status, response.text);
      })
      .catch((error) => {
        console.error('Failed to send email:', error);
        alert('Failed to send email notification.');
      });
  };

  // Function to handle rejecting a request
  const handleReject = async (id) => {
    try {
      await deleteRequest(id);
      alert('Request rejected and deleted');
    } catch (err) {
      console.error('Error rejecting request:', err);
      alert('Error rejecting request');
    }
  };

  // Helper function to delete a request from AdminLoginRequest collection
  const deleteRequest = async (id) => {
    const deleteUrl = `${adminLoginRequestUrl}/${id}`;
    const response = await fetch(deleteUrl, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error('Failed to delete request');
    } else {
      // Update local state to remove the deleted request
      setRequests((prevRequests) => prevRequests.filter((req) => req.id !== id));
    }
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div>
      <h2>Admin Login Requests</h2>
      <div>
        {requests.map((request) => (
          <div key={request.id} style={styles.requestContainer}>
            <p><strong>Full Name:</strong> {request.fullName}</p>
            <p><strong>Email:</strong> {request.email}</p>
            <p><strong>Account Number:</strong> {request.accountNumber}</p>
            <p><strong>Balance:</strong> {request.Balance}</p>
            <p><strong>Aadhar Card:</strong></p>
            {request.aadharCard && (
              <img
                src={`data:image/jpeg;base64,${request.aadharCard}`}
                alt="Aadhar Card"
                style={styles.image}
              />
            )}
            <p><strong>PAN Card:</strong></p>
            {request.panCard && (
              <img
                src={`data:image/jpeg;base64,${request.panCard}`}
                alt="PAN Card"
                style={styles.image}
              />
            )}
            {request.image && (
              <div>
                <strong>Image:</strong>
                <img
                  src={`data:image/png;base64,${request.image}`}
                  alt="User's Document"
                  style={styles.image}
                />
              </div>
            )}
            <div style={styles.buttonContainer}>
              <button onClick={() => handleAccept(request)} style={styles.acceptButton}>Accept</button>
              <button onClick={() => handleReject(request.id)} style={styles.rejectButton}>Reject</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  requestContainer: {
    border: '1px solid #ccc',
    padding: '15px',
    marginBottom: '10px',
    borderRadius: '5px',
  },
  buttonContainer: {
    marginTop: '10px',
  },
  acceptButton: {
    backgroundColor: 'green',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
    marginRight: '10px',
    cursor: 'pointer',
  },
  rejectButton: {
    backgroundColor: 'red',
    color: 'white',
    padding: '10px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  image: {
    maxWidth: '100px',
    maxHeight: '100px',
    display: 'block',
    marginTop: '10px',
  },
};

export default AdminLoginRequests;



