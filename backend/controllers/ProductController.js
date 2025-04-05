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

exports.createProduct = async (req, res, next) => {
  console.log(req.body);
  try {
    req.body.images = await ImageFile.uploadMultiple({
      imageFiles: req.files,
      request: req,
    });

    const product = await Product.create(req.body);

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

exports.AddReview = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid product ID format" 
      });
    }
    
    req.body.user = req.user._id;
    req.body.product = req.params.id;
    const review = await Review.create(req.body);
    
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    await Product.findByIdAndUpdate(
      req.params.id,
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

exports.EditReview = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid review ID format" 
      });
    }
    
    const review = await Review.findByIdAndUpdate(req.params.id, req.body, { new: true });
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Review not found" 
      });
    }
    
    res.status(200).json({ success: true, message: "Review Updated", review });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error updating review",
      error: err.message 
    });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid review ID format" 
      });
    }
    
    const review = await Review.findByIdAndDelete(req.params.id);
    
    if (!review) {
      return res.status(404).json({ 
        success: false, 
        message: "Review not found" 
      });
    }
    
    res.status(200).json({ success: true, message: "Review Deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ 
      success: false, 
      message: "Error deleting review",
      error: err.message 
    });
  }
};