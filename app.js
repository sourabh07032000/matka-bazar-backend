require('dotenv').config(); // Load environment variables
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const jsonServer = require('json-server');
const bodyParser = require("body-parser");
const twilio = require('twilio');

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function getGeminiResponse(prompt) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

// Example usage:
getGeminiResponse("What's the capital of India?").then(console.log);

const app = express();
// Increase the request size limit
app.use(bodyParser.json({ limit: "100mb" }));
app.use(bodyParser.urlencoded({ limit: "100mb", extended: true }));


// ✅ Replace with your actual credentials
const accountSid = process.env.TWILIO_ACCOUNT_SID; // or hardcoded for testing
const authToken = process.env.TWILIO_AUTH_TOKEN;

const client = twilio(accountSid, authToken);
client.api.accounts(accountSid)
  .fetch()
  .then(account => console.log('Twilio account verified:', account.friendlyName))
  .catch(err => console.error('Twilio auth failed:', err.message, process.env.TWILIO_ACCOUNT_SID));



// Middleware to handle CORS
app.use(cors());

// Middleware to parse incoming JSON requests
app.use(express.json());

// JSON Server Setup (for `/user` route)
const jsonRouter = jsonServer.router(path.join(__dirname, 'db.json')); // Path to `db.json`
const jsonMiddlewares = jsonServer.defaults();
app.use('/users', jsonMiddlewares, jsonServer.bodyParser, jsonRouter); // `/user` routes handled by JSON Server

// Express Routes for other services
const otpRoutes = require('./routes/otpRoutes'); // OTP routes
const betRoutes = require('./routes/betRoutes'); // Betting routes
const marketDataRoutes = require('./routes/marketData'); // Market data routes
const resultRoutes = require('./routes/resultUpdate'); // Result update routes
const paymentDetailsRoutes = require('./routes/paymentDetails'); // Payment details routes
const marketHistoryRoutes = require('./routes/marketHistory'); // Market history routes
const notificationRoutes = require('./routes/notificationRoutes'); // Notification routes
const slabRoutes = require('./routes/slabRoutes'); // Slab routes
const userRoutes = require('./routes/user'); // user routes

// Firebase Admin Setup for Notifications
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: 'matka-app-b73f1',
});

// Add Firebase Admin to app locals for shared use across routes
app.locals.admin = admin;

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
  });

// Express Routes
app.use('/newOtp', otpRoutes); // OTP routes
app.use('/user', userRoutes); 
app.use('/bet', betRoutes); // Betting routes
app.use('/api', resultRoutes); // Result update routes
app.use('/api/market-data', marketDataRoutes); // Market data routes
app.use('/api/', paymentDetailsRoutes); // Payment details routes
app.use('/api/marketHistory', marketHistoryRoutes); // Market history routes
app.use('/notifications', notificationRoutes); // Notification routes
app.use('/api/slabs', slabRoutes); // Slab routes
app.use('/', require('./routes/whatsapp'))

// Test Route
app.get('/test', (req, res) => {
  res.status(200).send('Server is running');
});

// Global Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send({ message: 'Internal Server Error', error: err.message });
});

// Define the Port
const PORT = process.env.PORT || 8002;

// Start the Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
