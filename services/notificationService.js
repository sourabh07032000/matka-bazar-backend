const admin = require('firebase-admin');

// Function to send a notification
const sendMarketUpdateNotification = async (token, title, body) => {
  const message = {
    notification: {
      title,
      body,
    },
    token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

module.exports = { sendMarketUpdateNotification };

