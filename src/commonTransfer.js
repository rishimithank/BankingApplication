import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function TransferForm() {
  const [formData, setFormData] = useState({
    ifsc: '',
    accountNumber: '',
    amount: '',
  });

  //const senderAccountNumber = localStorage.getItem("accountNumber");
  const email = localStorage.getItem("email");
  const location = useLocation();
  const accountDetails = location.state?.accountDetails || {};
  console.log(accountDetails);
  const senderBalance = accountDetails.Balance?.integerValue || accountDetails.Balance?.doubleValue ; // Use optional chaining to handle any undefined value
  const senderAccountNumber = accountDetails.accountNumber?.stringValue || '';
  console.log(senderBalance);


  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      submitTransfer(formData);
    } else {
      setErrors(newErrors);
    }
  };

  // Validate the form fields
  const validateForm = () => {
    let errors = {};


    if (!formData.amount) {
      errors.amount = 'Amount is required';
    } else if (isNaN(formData.amount) || formData.amount <= 0) {
      errors.amount = 'Amount should be a valid positive number';
    }

    return errors;
  };

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Submit transfer data to Firestore via REST API
  const submitTransfer = async (formData) => {
    const { ifsc, accountNumber, amount } = formData;
    
      // Replace this with the actual sender's account number

    const apiUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${ifsc}`;

    // Construct the request payload
    const data = {
      fields: {
        [accountNumber]: {
          arrayValue: {
            values: [
              {
                mapValue: {
                  fields: {
                    senderAccountNumber: { stringValue: senderAccountNumber },
                    amount: { integerValue: amount },
                  },
                },
              },
            ],
          },
        },
      },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setSuccessMessage('Transfer successful!');
        setErrorMessage('');
        console.log('Transfer data:', formData);
      } else {
        const errorData = await response.json();
        setErrorMessage('Transfer failed. Please try again.');
        console.error('Error:', errorData);
      }

      const senderResponse = await fetch(
        `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}`
      );

      const senderData = await senderResponse.json();

      if (!senderResponse.ok || !senderData || !senderData.fields) {
        setErrorMessage('Sender document not found.');
        return;
      }

      // Update the sender's details array
      const newSenderBalance = senderBalance - parseFloat(amount);
    
    
      const senderDetailsArray = senderData.fields.details?.arrayValue?.values || [];
      const updatedSenderDetails = senderDetailsArray.map((detail) => {
        if (detail.mapValue?.fields?.accountNumber?.stringValue === senderAccountNumber) {
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
        `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}?updateMask.fieldPaths=details`,
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

      
    } 
    catch (error) {
      setErrorMessage('An error occurred during transfer.');
      console.error('Error:', error);
    }

    const commonDbApiUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${ifsc}`;

    try {
        // Fetch the document with matching IFSC from the common_db
        const commonDbResponse = await fetch(commonDbApiUrl);
        const commonDbData = await commonDbResponse.json();

        if (!commonDbResponse.ok || !commonDbData.fields) {
            setErrorMessage('IFSC document not found.');
            return;
        }

        // Extract the account numbers and amounts from the common_db document
        const accountDetailsArray = Object.values(commonDbData.fields).flatMap(account => 
            account.arrayValue?.values || []
        );

        const senderAccountData = accountDetailsArray.find(detail => 
            detail.mapValue?.fields?.senderAccountNumber?.stringValue === senderAccountNumber
        );

        if (!senderAccountData) {
            setErrorMessage('Sender account not found in common_db.');
            return;
        }

        // Retrieve amount and sender's account number from common_db
        const transferAmount = parseFloat(senderAccountData.mapValue.fields.amount.integerValue || 0);

        // Traverse the customer database to find receiver's account and update the balance
        const receiverApiUrl = `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}`;
        const receiverResponse = await fetch(receiverApiUrl);
        const receiverData = await receiverResponse.json();

        if (!receiverResponse.ok || !receiverData.fields) {
            setErrorMessage('Receiver document not found.');
            return;
        }

        const receiverDetailsArray = receiverData.fields.details?.arrayValue?.values || [];

        // Find the matching receiver's account number
        const updatedReceiverDetails = receiverDetailsArray.map(detail => {
            const detailAccountNumber = detail.mapValue?.fields?.accountNumber?.stringValue;
            
            if (detailAccountNumber === accountNumber) {
                // If account numbers match, add the transfer amount to the balance
                const receiverBalance = parseFloat(detail.mapValue.fields.Balance?.doubleValue || 0);
                const newReceiverBalance = receiverBalance + transferAmount;
                console.log(newReceiverBalance);

                return {
                    mapValue: {
                        fields: {
                            ...detail.mapValue.fields,
                            Balance: { doubleValue: newReceiverBalance }, // Update the balance
                        },
                    },
                };
            }
            return detail;
        });

        // Prepare the payload for updating the receiver's document
        const receiverUpdatePayload = {
            fields: {
                details: {
                    arrayValue: {
                        values: updatedReceiverDetails,
                    },
                },
            },
        };

        // Update the receiver's Firestore document
        const updateReceiverResponse = await fetch(
            `https://firestore.googleapis.com/v1/projects/bankingmanagement-4ab47/databases/(default)/documents/customer/${email}?updateMask.fieldPaths=details`,
            {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(receiverUpdatePayload),
            }
        );

        // if (updateReceiverResponse.ok) {
        //     setSuccessMessage('Transfer successful and receiver balance updated!');
      
        //     // DELETE the transfer request from the common database
        //     const deleteApiUrl = `https://firestore.googleapis.com/v1/projects/bank-common-db/databases/(default)/documents/common_db/${ifsc}`;
        //     const deleteResponse = await fetch(deleteApiUrl, {
        //       method: 'DELETE',
        //     });
      
        //     if (deleteResponse.ok) {
        //       console.log('Transfer request deleted from common database');
        //     } else {
        //       console.error('Failed to delete transfer request from common database');
        //     }
        //   } else {
        //     throw new Error('Failed to update receiver balance');
        //   }
    } catch (error) {
        setErrorMessage('An error occurred during transfer.');
        console.error('Error:', error);
    }
  };

  return (
    <div style={styles.formContainer}>
      <h2 style={styles.formTitle}>Transfer Funds</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.formGroup}>
          <label htmlFor="ifsc" style={styles.label}>IFSC Code:</label>
          <input
            type="text"
            name="ifsc"
            id="ifsc"
            value={formData.ifsc}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter IFSC Code"
          />
          {errors.ifsc && <span style={styles.error}>{errors.ifsc}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="accountNumber" style={styles.label}>Receiver's Account Number:</label>
          <input
            type="text"
            name="accountNumber"
            id="accountNumber"
            value={formData.accountNumber}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter Account Number"
          />
          {errors.accountNumber && <span style={styles.error}>{errors.accountNumber}</span>}
        </div>

        <div style={styles.formGroup}>
          <label htmlFor="amount" style={styles.label}>Amount to Transfer:</label>
          <input
            type="text"
            name="amount"
            id="amount"
            value={formData.amount}
            onChange={handleChange}
            style={styles.input}
            placeholder="Enter Amount"
          />
          {errors.amount && <span style={styles.error}>{errors.amount}</span>}
        </div>

        <button type="submit" style={styles.submitButton}>Transfer</button>

        {successMessage && <p style={styles.successMessage}>{successMessage}</p>}
        {errorMessage && <p style={styles.errorMessage}>{errorMessage}</p>}
      </form>
    </div>
  );
}

const styles = {
  formContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: '40px',
    borderRadius: '10px',
    maxWidth: '400px',
    margin: '50px auto',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
  formTitle: {
    marginBottom: '20px',
    color: '#333',
    fontSize: '24px',
    fontWeight: '600',
  },
  form: {
    width: '100%',
  },
  formGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    color: '#555',
    fontSize: '14px',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #ccc',
    fontSize: '16px',
    transition: 'border-color 0.3s',
    outline: 'none',
  },
  submitButton: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: '#007BFF',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    cursor: 'pointer',
    transition: 'background-color 0.3s',
  },
  successMessage: {
    color: 'green',
    marginTop: '10px',
  },
  errorMessage: {
    color: 'red',
    marginTop: '10px',
  },
  error: {
    color: 'red',
    fontSize: '12px',
    marginTop: '5px',
  },
};

export default TransferForm;
