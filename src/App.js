import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './LoginPage';
import CustomerDetailsForm from './CustomerDetailsForm';
import AdminPage from './admin-page'; // Import the Admin page component
import AdminOperations from './adminOperations';
import AdminLogin from './adminlogin';
import CommonLoginPage from './commonLoginPage';
import AccountDetailsPage from './AccountDetailsPage';
import LoanRequestsPage from './loan-requests';
import TransactionPage from './transaction';
import CommonTransfer from './commonTransfer';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/customer-form" element={<CustomerDetailsForm />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/adminOperations" element={<AdminOperations/>} /> {/* Route for Admin Page */}
        <Route path="/adminlogin" element={<AdminLogin/>} /> {/* Route for Admin Page */}
        <Route path="/commonLoginPage" element={<CommonLoginPage/>}/>
        <Route path="/account-details" element={<AccountDetailsPage/>} />
        <Route path="/loan-requests" element={<LoanRequestsPage/>} />
        <Route path="/transaction" element={<TransactionPage />} />
        <Route path= "/commonTransfer" element={<CommonTransfer/>}/>
      </Routes>
    </Router>
  );
}

export default App;
