const express = require('express');
const router = express.Router();
const db = require('../firebase');

// Admin approves or rejects account creation
router.post('/approve/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // 'approved', 'rejected', or 'hold'
  
  try {
    const userRef = db.collection('users').doc(id);
    await userRef.update({ status });

    // Send email notification (setup nodemailer)
    sendNotificationEmail(status);

    res.json({ message: 'Account status updated.' });
  } catch (error) {
    res.status(500).json({ error: 'Error updating status.' });
  }
});

// Helper function for sending emails
const sendNotificationEmail = (status) => {
  // Nodemailer setup here
};

module.exports = router;
