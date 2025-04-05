const Brand = require("../models/brand");
const ImageFile = require("../utils/ImageFile");

exports.createBrand = async (req, res, next) => {
  try {
    // Handle case where no files are uploaded
    if (req.files && req.files.length > 0) {
      req.body.images = await ImageFile.uploadMultiple({
        imageFiles: req.files,
        request: req,
      });
    } else {
      req.body.images = [];
    }

    // Ensure description field is present
    if (!req.body.description) {
      req.body.description = req.body.name || "Brand description";
    }

    const brand = await Brand.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Brand successfully created",
      brand: brand,
    });
  } catch (error) {
    console.log("Error creating a brand", error);
    return res.status(500).json({ 
      success: false,
      message: "Brand Creation Failed", 
      error: error.message 
    });
  }
};

exports.allBrand = async (req, res) => {
  try {
    const brands = await Brand.find();
    return res.status(200).json({
      success: true,
      brand: brands,
    });
  } catch (err) {
    console.log("Error fetching brands", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to fetch brands", 
      error: err.message 
    });
  }
};

exports.updateBrand = async (req, res) => {
  try {
    if (req.files && req.files.length > 0) {
      req.body.images = await ImageFile.uploadMultiple({
        imageFiles: req.files,
        request: req,
      });
    }

    const brand = await Brand.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    
    if (!brand) {
      return res.status(404).json({ 
        success: false, 
        message: "Brand not found" 
      });
    }
    
    return res.status(200).json({ 
      success: true, 
      message: "Brand is Updated", 
      brand: brand 
    });
  } catch (err) {
    console.log("Error updating brand", err);
    return res.status(500).json({ 
      success: false, 
      message: "Error updating brand",
      error: err.message 
    });
  }
};

exports.deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      message: "Brand Deleted",
    });
  } catch (err) {
    console.log("Error deleting brand", err);
    return res.status(500).json({
      success: false,
      message: "Error deleting brand",
      error: err.message
    });
  }
};

exports.getSingleBrand = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found"
      });
    }
    
    return res.status(200).json({
      success: true,
      brand: brand,
    });
  } catch (err) {
    console.log("Error retrieving brand", err);
    return res.status(500).json({
      success: false,
      message: "Error retrieving brand",
      error: err.message
    });
  }
};