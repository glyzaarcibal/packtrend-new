// database.js
require('dotenv').config();
const app = require("./index");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const path = require('path');
const ip = require('./utils/ipAddress');

// Get port from environment variables or use default
const port = process.env.PORT || 8000;

// Get MongoDB URI from environment variables
const mongoURI = process.env.MONGODB_URI;

// JWT Secret from environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'b2e6ee00f9c0db7cd099a53bd8e8269e3fc876b7c28465f8032307e5510672c4f92025cf469b3fcc51d3b2af05ff441d232109e4de6f6a9af6987ff1fe6518cb';

// JWT Configuration
const JWT_CONFIG = {
  // Token expiration time (e.g., 7 days)
  expiresIn: '7d',
  // Token issuer
  issuer: 'your-app-name'
};

// Generate JWT token
const generateToken = (userId, deviceId = null) => {
  const payload = {
    userId,
    deviceId,
    createdAt: Date.now()
  };
  
  return jwt.sign(payload, JWT_SECRET, JWT_CONFIG);
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

// Refresh token if needed
const refreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // If token is close to expiration (e.g., less than 24 hours remaining)
    const tokenExpiryDate = new Date(decoded.exp * 1000);
    const currentDate = new Date();
    const timeRemaining = tokenExpiryDate - currentDate;
    
    // If less than 24 hours remaining, generate a new token
    if (timeRemaining < 24 * 60 * 60 * 1000) {
      return generateToken(decoded.userId, decoded.deviceId);
    }
    
    // Otherwise return the original token
    return token;
  } catch (error) {
    console.error("Token refresh failed:", error.message);
    return null;
  }
};

// Make JWT functions available globally
global.jwt = {
  generateToken,
  verifyToken,
  refreshToken
};

// Connect to MongoDB
mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(ip);
    
    // Start the server after database is connected
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log("JWT authentication ready");
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });