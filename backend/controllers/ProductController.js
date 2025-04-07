const Product = require("../models/product");
const Brand = require("../models/brand");
const Order = require("../models/order");
const Review = require("../models/review");
const ImageFile = require("../utils/ImageFile");
const mongoose = require("mongoose");

async function calculateAverageRating(reviews) {
  const totalRatings = reviews.length;
  const sumRatings = reviews.reduce((acc, review) => acc + review.ratings, 0);
  const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;
  return averageRating;
}

exports.getProducts = async (req, res) => {
  try {
    const product = await Product.find();

    res.status(200).json({
      product: product,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching products",
      error: err.message 
    });
  }
};

exports.reviewsOfProduct = async (req, res, next) => {
  try {
    console.log(req.params.id);
    const reviews = await Review.find({
      product: req.params.id,
    });

    const rating = await calculateAverageRating(reviews);

    return res.status(200).json({
      success: true,
      reviews: reviews,
      rating: rating,
      totalReviews: reviews.length,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching reviews",
      error: err.message 
    });
  }
};

// In ProductController.js
exports.createProduct = async (req, res, next) => {
  console.log("Form data received:", req.body);
  console.log("Files received:", req.files);
  
  try {
    // Parse the _parts string if it exists
    let productData = {};
    
    if (req.body._parts) {
      // The _parts is a string containing key-value pairs separated by commas
      const partsArray = req.body._parts.split(',');
      
      // Process in pairs (key, value)
      for (let i = 0; i < partsArray.length; i += 2) {
        if (i + 1 < partsArray.length) {
          const key = partsArray[i];
          const value = partsArray[i + 1];
          
          // Skip images field as it will be handled separately
          if (key !== 'images') {
            productData[key] = value;
          }
        }
      }
    } else {
      // If _parts doesn't exist, use the regular req.body
      productData = {
        name: req.body.name,
        price: req.body.price,
        description: req.body.description,
        color: req.body.color,
        brand: req.body.brand,
        type: req.body.type,
        stock: req.body.stock
      };
    }
    
    // Handle image upload
    if (req.files && req.files.length > 0) {
      productData.images = await ImageFile.uploadMultiple({
        imageFiles: req.files,
        request: req,
      });
    }
    
    console.log("Processed product data:", productData);
    
    // Additional validation before creating
    if (!productData.name || !productData.brand || !productData.type || 
        !productData.color || !productData.description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: productData
      });
    }
    
    const product = await Product.create(productData);

    return res.status(201).json({
      success: true,
      message: "Product successfully created",
      product: product,
    });
  } catch (error) {
    console.log("error creating a product", error);
    res.status(500).json({
      success: false,
      message: "Product Creation Failed",
      error: error.message
    });
  }
};

exports.singleProduct = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    console.log(product);
    res.status(200).json({ success: true, product });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching product",
      error: err.message 
    });
  }
};

exports.updateProduct = async (req, res) => {
  console.log("Update Product - ID:", req.params.id);
  console.log("Update Product - Body:", req.body);
  
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }
    
    if (req.files?.length > 0) {
      req.body.images = await ImageFile.uploadMultiple({
        imageFiles: req.files,
        request: req,
      });
    }

    const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    res.status(200).json({ 
      success: true, 
      message: "Product is Updated", 
      product: product 
    });
  } catch (err) {
    console.log("Error updating product:", err);
    res.status(500).json({ 
      success: false, 
      message: "Error updating product",
      error: err.message 
    });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }
    
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    res.status(200).json({
      success: true,
      message: "Product Deleted",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting product",
      error: err.message 
    });
  }
};

exports.getMyReviewsForProduct = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }
    
    // Get the authenticated user's ID
    const userId = req.user._id;
    
    // Find the user's reviews for this product
    const reviews = await Review.find({
      product: req.params.id,
      user: userId
    });
    
    res.status(200).json({
      success: true,
      reviews
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching user's reviews",
      error: err.message 
    });
  }
};

// Modify the AddReview function to verify purchase before allowing review
exports.AddReview = async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }
    
    // Check if the product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }
    
    // Verify that the user has purchased this product
    const purchaseVerified = await Order.findOne({
      user: userId,
      'orderItems.product': productId,
      status: "1" // Delivered status
    });
    
    if (!purchaseVerified) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased and received"
      });
    }
    
    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({
      user: userId,
      product: productId
    });
    
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product. Please edit your existing review."
      });
    }
    
    // Create the review
    req.body.user = userId;
    req.body.product = productId;
    const review = await Review.create(req.body);
    
    // Add review to product
    await Product.findByIdAndUpdate(
      productId,
      {
        $push: { reviews: review._id },
      },
      { new: true }
    );

    res.status(200).json({ success: true, review });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Server error adding review",
      error: err.message 
    });
  }
};

// Modify EditReview to verify ownership
exports.EditReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;
    
    // Validate input parameters
    if (!reviewId) {
      return res.status(400).json({ 
        success: false, 
        message: "Review ID is required" 
      });
    }
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid review ID format" 
      });
    }
    
    // Find the review and populate user information for more detailed logging
    const review = await Review.findById(reviewId).populate('user');
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Review not found" 
      });
    }
    
    // Detailed logging for debugging
    console.log("Edit Review Request Details:", {
      reviewId,
      requestUserId: userId.toString(),
      reviewUserId: review.user._id.toString(),
      requestBody: req.body
    });
    
    // Verify ownership (users can only edit their own reviews)
    if (review.user._id.toString() !== userId.toString()) {
      console.warn("Unauthorized review edit attempt:", {
        requestUserId: userId.toString(),
        reviewUserId: review.user._id.toString(),
        reviewId
      });
      
      return res.status(403).json({
        success: false,
        message: "You can only edit your own reviews"
      });
    }
    
    // Validate input for update
    const { ratings, comment } = req.body;
    
    if (!ratings || ratings < 1 || ratings > 5) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid rating. Must be between 1 and 5" 
      });
    }
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Comment cannot be empty" 
      });
    }
    
    // Update the review
    const updatedReview = await Review.findByIdAndUpdate(
      reviewId, 
      {
        ratings: ratings,
        comment: comment.trim()
      }, 
      { 
        new: true,
        runValidators: true 
      }
    );
    
    // Additional logging for successful update
    console.log("Review Updated Successfully:", {
      reviewId,
      userId: userId.toString(),
      newRating: ratings,
      commentLength: comment.length
    });
    
    res.status(200).json({ 
      success: true, 
      message: "Review Updated", 
      review: updatedReview 
    });
  } catch (err) {
    // Comprehensive error logging
    console.error("Error updating review:", {
      error: err.message,
      stack: err.stack,
      reviewId: req.params.id,
      userId: req.user?._id
    });
    
    res.status(500).json({ 
      success: false, 
      message: "Error updating review",
      error: err.message 
    });
  }
};

// Modify deleteReview to verify ownership
exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.id;
    const userId = req.user._id;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(reviewId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid review ID format" 
      });
    }
    
    // Find the review
    const review = await Review.findById(reviewId);
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Review not found" 
      });
    }
    
    // Verify ownership (users can only delete their own reviews)
    // Allow admins to delete any review
    const isAdmin = req.user.isAdmin === true;
    
    if (!isAdmin && review.user.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only delete your own reviews"
      });
    }
    
    // Remove the review from the product
    await Product.findByIdAndUpdate(
      review.product,
      {
        $pull: { reviews: reviewId },
      }
    );
    
    // Delete the review
    await Review.findByIdAndDelete(reviewId);
    
    res.status(200).json({ 
      success: true, 
      message: "Review Deleted" 
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting review",
      error: err.message 
    });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    
    // Find all reviews by this user and populate product information
    const reviews = await Review.find({ user: userId })
      .populate({
        path: 'product',
        select: 'name images price'
      })
      .sort({ createdAt: -1 }); // Most recent reviews first
    
    res.status(200).json({
      success: true,
      reviews
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching user's reviews",
      error: err.message 
    });
  }
};

exports.verifyPurchase = async (req, res, next) => {
  try {
    const productId = req.params.id;
    const userId = req.user._id;
    
    // Check if the user has purchased this product
    const purchaseVerified = await Order.findOne({
      user: userId,
      'orderItems.product': productId,
      status: "1" // Delivered status
    });
    
    if (!purchaseVerified) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased and received"
      });
    }
    
    // If purchase is verified, proceed to the next middleware
    next();
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error verifying purchase",
      error: err.message 
    });
  }
};