// controllers/UserController.js
const User = require("../models/user");
const crypto = require("crypto");
const ImageFile = require("../utils/ImageFile");
const ip = require("../utils/ipAddress");
const bcrypt = require("bcryptjs");
const tokenService = require("../utils/tokenService");
const pushNotificationService = require("../utils/pushNotificationService");

// Load environment variables
const dotenv = require("dotenv");
dotenv.config({ path: "../.env" });

exports.login = async (req, res) => {
  try {
    const { email, password, deviceId } = req.body;
    
    // Input validation
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check if the password is correct using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update push token if provided
    const { pushToken } = req.body;
    if (pushToken) {
      await pushNotificationService.registerPushToken(user._id, pushToken, deviceId);
    }

    // Generate JWT token and store in SQLite
    const token = await tokenService.generateToken(
      { userId: user._id, email: user.email },
      deviceId
    );

    // Remove sensitive data before sending response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      image: user.image,
      isAdmin: user.isAdmin,
    };

    res.status(200).json({ user: userResponse, token });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login failed" });
  }
};

exports.logout = async (req, res) => {
  try {
    // Revoke the current token
    const token = req.token;
    const userId = req.user._id;
    
    await tokenService.revokeToken(userId, token);
    
    // Remove push token if provided
    const { pushToken } = req.body;
    if (pushToken) {
      await pushNotificationService.removePushToken(userId, pushToken);
    }
    
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Logout failed" });
  }
};

exports.logoutAll = async (req, res) => {
  try {
    // Revoke all tokens for this user
    const userId = req.user._id;
    
    await tokenService.revokeAllTokens(userId);
    
    res.status(200).json({ message: "Logged out from all devices successfully" });
  } catch (error) {
    console.error("Logout all error:", error);
    res.status(500).json({ message: "Logout from all devices failed" });
  }
};

exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    
    // Input validation
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Check if the email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create a new user
    const newUser = new User({ 
      name, 
      email, 
      password: hashedPassword,
      phone,
      verified: true,  // Set verified to true by default
      pushTokens: [],
      pushTokensWithMetadata: []
    });

    // Save the user to the database
    await newUser.save();

    res.status(201).json({ 
      message: "Registration successful! You can now log in." 
    });
  } catch (error) {
    console.error("Error registering user", error);
    res.status(500).json({ message: "Registration failed" });
  }
};

exports.registerPushToken = async (req, res) => {
  try {
    const { pushToken, deviceId } = req.body;
    
    if (!pushToken) {
      return res.status(400).json({ message: "Push token is required" });
    }

    const userId = req.user._id;
    
    await pushNotificationService.registerPushToken(userId, pushToken, deviceId);
    
    res.status(200).json({ message: "Push token registered successfully" });
  } catch (error) {
    console.error("Error registering push token:", error);
    res.status(500).json({ message: "Failed to register push token" });
  }
};

exports.removePushToken = async (req, res) => {
  try {
    const { pushToken } = req.body;
    
    if (!pushToken) {
      return res.status(400).json({ message: "Push token is required" });
    }

    const userId = req.user._id;
    
    await pushNotificationService.removePushToken(userId, pushToken);
    
    res.status(200).json({ message: "Push token removed successfully" });
  } catch (error) {
    console.error("Error removing push token:", error);
    res.status(500).json({ message: "Failed to remove push token" });
  }
};

exports.userProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password -pushTokens');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ message: "Failed to fetch user profile" });
  }
};

exports.addAddress = async (req, res) => {
  try {
    const { address } = req.body;
    
    if (!address) {
      return res.status(400).json({ message: "Address is required" });
    }

    // Find the user by the UserId
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Initialize addresses array if it doesn't exist
    if (!user.addresses) {
      user.addresses = [];
    }

    // Add the new address to the user's addresses array
    user.addresses.push(address);

    // Save the updated user in the backend
    await user.save();

    res.status(200).json({ message: "Address added successfully" });
  } catch (error) {
    console.error("Error adding address:", error);
    res.status(500).json({ message: "Error adding address" });
  }
};

exports.userAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const addresses = user.addresses || [];
    res.status(200).json({ addresses });
  } catch (error) {
    console.error("Error retrieving addresses:", error);
    res.status(500).json({ message: "Error retrieving addresses" });
  }
};

exports.userProfileUpdate = async (req, res) => {
  try {
    const { name, email } = req.body;
    const updateData = { name, email };
    
    // Handle image upload if files are present
    if (req.files?.length > 0) {
      updateData.image = await ImageFile.uploadMultiple({
        imageFiles: req.files,
        request: req,
      });
      
      // If array is returned, use first image
      if (Array.isArray(updateData.image)) {
        updateData.image = updateData.image[0];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password -pushTokens');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "Profile updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ message: "Failed to update profile" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    await user.save();
    
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Failed to change password" });
  }
};

// Admin functions
exports.getAllUsers = async (req, res) => {
  try {
    // Verify admin permission
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select('-password');
    
    res.status(200).json({ users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    // Verify admin permission
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    const user = await User.findById(req.params.id)
      .select('-password');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user info:", error);
    res.status(500).json({ message: "Failed to fetch user information" });
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    // Verify admin permission
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    const { name, email, isAdmin } = req.body;
    const updateData = { name, email };
    
    // Admin can toggle isAdmin status
    if (typeof isAdmin === 'boolean') {
      updateData.isAdmin = isAdmin;
    }
    
    // Handle image upload if files are present
    if (req.files?.length > 0) {
      updateData.image = await ImageFile.uploadMultiple({
        imageFiles: req.files,
        request: req,
      });
      
      // If array is returned, use first image
      if (Array.isArray(updateData.image)) {
        updateData.image = updateData.image[0];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).select('-password -pushTokens');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ 
      success: true, 
      message: "User updated successfully",
      user: updatedUser 
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Failed to update user" });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    // Verify admin permission
    if (!req.user.isAdmin) {
      return res.status(403).json({ message: "Unauthorized access" });
    }
    
    const user = await User.findByIdAndDelete(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};