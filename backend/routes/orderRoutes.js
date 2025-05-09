const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");

const { 
  placeOrder, 
  getAllOrder, 
  UpdateStatus, 
  getSingleOrderUser, 
  calculateAverageSalesPerProduct, 
  calculateTotalSalesPerProduct, 
  MonthlyIncome,
  updateOrder ,
  getSingleOrder// Import the new controller function
} = require("../controllers/orderController");
const { isAuthenticated } = require("../middlewares/Auth");

router.post("/order", isAuthenticated, placeOrder);
router.get("/all/orders", getAllOrder);
router.put("/update/status", UpdateStatus);
router.get("/get/single/order", isAuthenticated, getSingleOrderUser);
router.get("/average/sales", calculateAverageSalesPerProduct);
router.get("/total/sales", calculateTotalSalesPerProduct);
router.put("/orders/:id", isAuthenticated, updateOrder);

// Add the missing GET route for a single order by ID
router.get("/orders/:id", isAuthenticated, getSingleOrder);

module.exports = router;