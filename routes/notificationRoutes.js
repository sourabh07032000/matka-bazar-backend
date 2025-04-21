const express = require('express');
const { sendMarketUpdateNotification } = require('../services/notificationService');
const router = express.Router();

// Test notification route
router.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).json({ message: 'Missing required fields: token, title, body.' });
  }

  try {
    await sendMarketUpdateNotification(token, title, body);
    res.status(200).json({ message: 'Notification sent successfully.' });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ message: 'Failed to send notification.' });
  }
});

module.exports = router;
