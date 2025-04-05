// utils/tokenService.js
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure the directory exists
const dbDir = path.join(__dirname, '../db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize SQLite database
const db = new sqlite3.Database(path.join(dbDir, 'tokens.db'), (err) => {
  if (err) {
    console.error('Error opening tokens database:', err.message);
  } else {
    console.log('Connected to the tokens database.');
    
    // Create tokens table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      userId TEXT NOT NULL,
      token TEXT NOT NULL,
      deviceId TEXT,
      createdAt INTEGER NOT NULL,
      expiresAt INTEGER NOT NULL,
      revoked INTEGER DEFAULT 0
    )`, (err) => {
      if (err) {
        console.error('Error creating tokens table:', err.message);
      } else {
        console.log('Tokens table ready');
      }
    });
  }
});

// Load environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'b2e6ee00f9c0db7cd099a53bd8e8269e3fc876b7c28465f8032307e5510672c4f92025cf469b3fcc51d3b2af05ff441d232109e4de6f6a9af6987ff1fe6518cb';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Generate JWT token and store in SQLite
exports.generateToken = async (userData, deviceId = null) => {
  try {
    const payload = {
      ...userData,
      createdAt: Date.now()
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'your-app-name'
    });
    
    // Calculate expiration time
    const decoded = jwt.decode(token);
    const expiresAt = decoded.exp * 1000; // Convert to milliseconds
    
    // Store token in SQLite
    return new Promise((resolve, reject) => {
      db.run(
        `INSERT INTO tokens (userId, token, deviceId, createdAt, expiresAt) VALUES (?, ?, ?, ?, ?)`,
        [userData.userId, token, deviceId, Date.now(), expiresAt],
        function(err) {
          if (err) {
            console.error("Error storing token in SQLite:", err);
            // Still return the token even if storing fails
            resolve(token);
          } else {
            console.log(`Token stored with ID: ${this.lastID}`);
            resolve(token);
          }
        }
      );
    });
  } catch (error) {
    console.error("Token generation error:", error);
    throw error;
  }
};

// Verify token and check if it's valid and not revoked
exports.verifyToken = async (token) => {
  try {
    // First verify the JWT signature
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Then check if token is in the database and not revoked
    return new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM tokens WHERE token = ? AND revoked = 0 AND expiresAt > ?`, 
        [token, Date.now()], 
        (err, row) => {
          if (err) {
            console.error("Database error checking token:", err);
            reject(err);
          } else if (!row) {
            resolve(null); // Token not found or revoked
          } else {
            resolve(decoded);
          }
        }
      );
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
};

// Revoke a specific token
exports.revokeToken = async (userId, token) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tokens SET revoked = 1 WHERE userId = ? AND token = ?`,
      [userId, token],
      function(err) {
        if (err) {
          console.error("Error revoking token:", err);
          reject(err);
        } else {
          console.log(`Token revoked. Rows affected: ${this.changes}`);
          resolve(this.changes > 0);
        }
      }
    );
  });
};

// Revoke all tokens for a user
exports.revokeAllTokens = async (userId) => {
  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE tokens SET revoked = 1 WHERE userId = ?`,
      [userId],
      function(err) {
        if (err) {
          console.error("Error revoking all tokens:", err);
          reject(err);
        } else {
          console.log(`All tokens revoked for user. Rows affected: ${this.changes}`);
          resolve(this.changes > 0);
        }
      }
    );
  });
};

// Clean up expired tokens (can be run periodically)
exports.cleanupExpiredTokens = async () => {
  return new Promise((resolve, reject) => {
    db.run(
      `DELETE FROM tokens WHERE expiresAt < ?`,
      [Date.now()],
      function(err) {
        if (err) {
          console.error("Error cleaning up expired tokens:", err);
          reject(err);
        } else {
          console.log(`Expired tokens cleaned up. Rows removed: ${this.changes}`);
          resolve(this.changes);
        }
      }
    );
  });
};

// Get all active tokens for a user
exports.getUserTokens = async (userId) => {
  return new Promise((resolve, reject) => {
    db.all(
      `SELECT * FROM tokens WHERE userId = ? AND revoked = 0 AND expiresAt > ?`,
      [userId, Date.now()],
      (err, rows) => {
        if (err) {
          console.error("Error getting user tokens:", err);
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
};

// Close the database connection when the application shuts down
process.on('SIGINT', () => {
  db.close((err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Closed the tokens database connection.');
    process.exit(0);
  });
});