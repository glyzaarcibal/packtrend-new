const express = require("express");
const router = express.Router();
const upload = require('../utils/multer');

const { 
  login, 
  register, 
  userProfile, 
  addAddress, 
  userAddresses, 
  userProfileUpdate, 
  getAllUsers, 
  getUserInfo, 
  updateUserInfo, 
  deleteUser,
  registerPushToken,
  removePushToken,
  changePassword,
  logout,
  logoutAll
} = require("../controllers/UserController");
const { isAuthenticated } = require('../middlewares/Auth');

// Authentication routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", isAuthenticated, logout);
router.post("/logout-all", isAuthenticated, logoutAll);

// User profile routes
router.get('/profile', isAuthenticated, userProfile);
router.put("/update/user/profile", isAuthenticated, upload.array('image'), userProfileUpdate);
router.put('/change-password', isAuthenticated, changePassword);

// Address management
router.post('/address/create', isAuthenticated, addAddress);
router.get('/addresses', isAuthenticated, userAddresses);

// Push notification token management
router.post('/push-token/register', isAuthenticated, registerPushToken);
router.post('/push-token/remove', isAuthenticated, removePushToken);

// Admin routes
router.get("/all/users", isAuthenticated, getAllUsers);
router.get("/user-info/:id", isAuthenticated, getUserInfo);
router.put("/update/user/:id", isAuthenticated, upload.array('image'), updateUserInfo);
router.delete("/delete/user/:id", isAuthenticated, deleteUser);

module.exports = router;