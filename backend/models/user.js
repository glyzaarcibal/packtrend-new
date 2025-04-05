const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  addresses: [
    {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String,
      isDefault: {
        type: Boolean,
        default: false
      }
    }
  ],
  // Keeping the original pushTokens array for backward compatibility
  pushTokens: [String],
  
  // Enhanced push token storage with metadata
  pushTokensWithMetadata: [
    {
      token: {
        type: String,
        required: true
      },
      deviceId: {
        type: String,
        default: 'unknown'
      },
      platform: {
        type: String,
        enum: ['ios', 'android', 'web', 'unknown'],
        default: 'unknown'
      },
      lastUsed: {
        type: Date,
        default: Date.now
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for push tokens
UserSchema.index({ pushTokens: 1 });
UserSchema.index({ 'pushTokensWithMetadata.token': 1 });
UserSchema.index({ 'pushTokensWithMetadata.lastUsed': 1 });

module.exports = mongoose.model('User', UserSchema);