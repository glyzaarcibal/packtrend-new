const express = require("express");
const router = express.Router();
const upload = require('../utils/multer');

const { 
  getProducts, 
  createProduct, 
  singleProduct, 
  updateProduct, 
  deleteProduct, 
  AddReview, 
  reviewsOfProduct, 
  EditReview, 
  deleteReview,
  getMyReviewsForProduct,  // Import the new functions
  getMyReviews 
} = require("../controllers/ProductController");
const { isAuthenticated } = require("../middlewares/Auth");

// Existing routes
router.get("/get/products", getProducts);
router.post("/create/products", upload.array('images'), createProduct);
router.get("/get/single/product/:id", singleProduct);
router.put('/update/product/:id', upload.array('images'), updateProduct);
router.delete('/delete/product/:id', deleteProduct);

// Review routes with authentication
router.post("/create/review/:id", isAuthenticated, AddReview);
router.put("/edit/review/:id", isAuthenticated, EditReview);
router.get("/ratings/product/:id", reviewsOfProduct);
router.delete("/delete/review/:id", isAuthenticated, deleteReview);

// New routes for user reviews
router.get("/my-reviews/product/:id", isAuthenticated, getMyReviewsForProduct);
router.get("/my-reviews", isAuthenticated, getMyReviews);

module.exports = router;