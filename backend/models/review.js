const mongoose = require("mongoose");
const populate = require("mongoose-autopopulate");

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: true,
    autopopulate: true,
  },
  ratings: {
    type: Number,
    default: 0,
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: true,
    autopopulate: true,
  },
  comment: {
    type: String,
    required: true,
  },
});

reviewSchema.plugin(populate);
const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
