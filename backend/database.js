require('dotenv').config();
const app = require("./index");
const mongoose = require("mongoose");
const jwt = require('jsonwebtoken');
const path = require('path');
const ip = require('./utils/ipAddress');

const port = process.env.PORT || 8000;

const mongoURI = process.env.MONGODB_URI;

const JWT_SECRET = process.env.JWT_SECRET || 'b2e6ee00f9c0db7cd099a53bd8e8269e3fc876b7c28465f8032307e5510672c4f92025cf469b3fcc51d3b2af05ff441d232109e4de6f6a9af6987ff1fe6518cb';

const JWT_CONFIG = {
  expiresIn: '7d',
  issuer: 'your-app-name'
};

const generateToken = (userId, deviceId = null) => {
  const payload = {
    userId,
    deviceId,
    createdAt: Date.now()
  };
  
  return jwt.sign(payload, JWT_SECRET, JWT_CONFIG);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

const refreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const tokenExpiryDate = new Date(decoded.exp * 1000);
    const currentDate = new Date();
    const timeRemaining = tokenExpiryDate - currentDate;
    
    if (timeRemaining < 24 * 60 * 60 * 1000) {
      return generateToken(decoded.userId, decoded.deviceId);
    }
        return token;
  } catch (error) {
    console.error("Token refresh failed:", error.message);
    return null;
  }
};

global.jwt = {
  generateToken,
  verifyToken,
  refreshToken
};

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("Connected to MongoDB");
    console.log(ip);
    
    app.listen(port, () => {
      console.log(`Server is running on port ${port}`);
      console.log("JWT authentication ready");
    });
  })
  .catch((err) => {
    console.log("Error connecting to MongoDB:", err);
  });