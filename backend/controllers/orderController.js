
const User = require("../models/user");
const Order = require("../models/order");
const nodemailer = require("nodemailer");
const pushNotificationService = require("../utils/pushNotificationService");


exports.getSingleOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`Fetching order details for ID: ${id}`);
    
    const order = await Order.findById(id)
      .populate('orderItems.product')
      .populate('user', 'name email');
    
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    if (req.user.role !== 'admin' && order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to access this order"
      });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.log("Error fetching order details:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching order details", 
      error: error.message 
    });
  }
};


const sendOrderNotification = async (userEmail, products, orderDetails) => {
  try {
    console.log(`Would send order notification to ${userEmail} for ${products.length} products`);
    
    return true;
  } catch (error) {
    console.error('Failed to send order notification email:', error);
    return false; // Don't fail the order process if email fails
  }
};


exports.placeOrder = async (req, res, next) => {
  console.log("Order payload received:", req.body);
  try {
    // Handle both data formats (original and updated)
    let cartItems, totalPrice, shippingAddress, paymentMethod, status;
    
    // Check which format the data is in
    if (req.body.cartItems && req.body.totalPrice) {
      // Original format
      ({ cartItems, totalPrice, shippingAddress, paymentMethod, status } = req.body);
    } else if (req.body.orderItems) {
      // Alternative format (from Confirm.js)
      cartItems = req.body.orderItems;
      totalPrice = req.body.totalPrice;
      shippingAddress = {
        address1: req.body.shippingAddress1,
        address2: req.body.shippingAddress2 || '',
        city: req.body.city,
        zip: req.body.zip,
        country: req.body.country
      };
      paymentMethod = req.body.paymentMethod || 'Cash';
      status = req.body.status || '3'; // Default to pending (3)
    } else {
      // Handle new format where we receive cartItems in different format
      cartItems = req.body.cartItems;
      totalPrice = req.body.totalPrice;
      
      if (req.body.shippingAddress) {
        // Object format
        shippingAddress = req.body.shippingAddress;
      } else {
        // Fields format
        shippingAddress = {
          address1: req.body.shippingAddress1,
          address2: req.body.shippingAddress2 || '',
          city: req.body.city,
          zip: req.body.zip,
          country: req.body.country
        };
      }
      
      paymentMethod = req.body.paymentMethod || 'Cash';
      status = req.body.status || '3'; // Default to pending (3)
    }
    
    // Validate the required data
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({ message: "No items in cart" });
    }

    if (!totalPrice || isNaN(totalPrice) || totalPrice <= 0) {
      // Calculate total price from cart items if not provided or invalid
      totalPrice = cartItems.reduce((total, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 1;
        return total + (price * quantity);
      }, 0);
      
      if (totalPrice <= 0) {
        return res.status(400).json({ message: "Invalid total price" });
      }
    }

    if (!shippingAddress) {
      return res.status(400).json({ message: "Shipping address required" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Create an array of product objects from the cart Items
    const products = cartItems.map((item) => ({
      id: item?._id || item?.id || item?.product,
      name: item?.name,
      quantity: item.quantity || 1,
      price: item.price,
      image: item?.images ? item?.images[0] : item?.image || null,
    }));

    // Create order items in the format expected by the Order model
    const orderItems = products.map(item => ({
      product: item.id,
      quantity: item.quantity,
      price: item.price,
      name: item.name,
      image: item.image
    }));

    // Create a new Order
    const order = new Order({
      user: req.user._id,
      orderItems: orderItems,
      shippingAddress1: shippingAddress.address1,
      shippingAddress2: shippingAddress.address2 || '',
      city: shippingAddress.city,
      zip: shippingAddress.zip,
      country: shippingAddress.country,
      totalPrice: totalPrice,
      paymentMethod: paymentMethod,
      status: status || '3' // Ensure status is set with a default
    });

    const savedOrder = await order.save();
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { orders: savedOrder._id } },
      { new: true }
    );
    
    // Send email notification
    sendOrderNotification(req.user.email, products, {
      paymentMethod: paymentMethod,
      totalPrice: totalPrice
    });
    
    // Send push notification for new order
    try {
      // Create notification message
      const message = {
        title: "Order Received",
        body: `Your order has been placed successfully! Order #${savedOrder._id}`
      };
      
      // Include order details for deep linking
      const data = {
        screen: 'OrderDetail',
        orderId: savedOrder._id.toString(),
        status: savedOrder.status
      };
      
      // Send push notification
      await pushNotificationService.sendPushNotification(
        req.user._id,
        message,
        data
      );
    } catch (notificationError) {
      console.log("Error sending push notification:", notificationError);
      // Don't fail the order creation if notification fails
    }

    res.status(200).json({ 
      message: "Order created successfully!",
      _id: savedOrder._id,
      status: savedOrder.status
    });
  } catch (error) {
    console.log("Error creating orders", error);
    res.status(500).json({ message: "Error creating orders", error: error.message });
  }
};

exports.getAllOrder = async (req, res) => {
  const order = await Order.find();
  res.status(200).json({ order });
};

// Update order status (original method)
exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const newStatus = req.body.status;
    
    // Log for debugging
    console.log(`Updating order ${id} with status: ${newStatus}`);
    
    // Get order before update to compare status
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    const previousStatus = order.status;
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status: newStatus },
      { new: true }
    );
    
    // Send push notification if status changed
    if (previousStatus !== newStatus) {
      try {
        await pushNotificationService.sendOrderStatusNotification(
          order.user,
          updatedOrder,
          previousStatus
        );
        console.log(`Push notification sent for order ${id} status update`);
      } catch (notificationError) {
        console.log("Error sending status update notification:", notificationError);
        // Don't fail the update if notification fails
      }
    }
    
    res.status(200).json({ 
      success: true,
      order: updatedOrder
    });
  } catch (error) {
    console.log("Error updating order:", error);
    res.status(500).json({ 
      message: "Error updating order", 
      error: error.message 
    });
  }
};

// Alternative update status method
exports.UpdateStatus = async (req, res) => {
  try {
    // Log the incoming request data for debugging
    console.log("Update status request:", req.body);
    
    // Find and update the order
    const orderId = req.body.item || req.body.orderId;
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "Order ID is required"
      });
    }
    
    const newStatus = req.body.orderStatus || req.body.status;
    if (!newStatus) {
      return res.status(400).json({
        success: false,
        message: "Status is required"
      });
    }
    
    // Get order before update to compare status
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }
    
    const previousStatus = order.status;
    
    // Update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: newStatus },
      { new: true }
    );
    
    // Send push notification if status changed
    if (previousStatus !== newStatus) {
      try {
        await pushNotificationService.sendOrderStatusNotification(
          order.user,
          updatedOrder,
          previousStatus
        );
        console.log(`Push notification sent for order ${orderId} status update`);
      } catch (notificationError) {
        console.log("Error sending status update notification:", notificationError);
        // Don't fail the update if notification fails
      }
    }
    
    // Send back a success response
    res.status(200).json({ 
      success: true, 
      message: "Order status updated successfully",
      order: updatedOrder
    });
  } catch (err) {
    console.log("Error updating order status:", err);
    res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: err.message
    });
  }
};

exports.getSingleOrderUser = async (req, res) => {
  try {
    const order = await Order.find({ user: req.user._id });
    res.status(200).json({ order });
  } catch (err) {
    console.log(err);
  }
};

exports.calculateAverageSalesPerProduct = async (req, res) => {
  try {
    const averageSalesPerProduct = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          averageSales: { $avg: "$orderItems.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          label: { $arrayElemAt: ["$productDetails.name", 0] },
          value: "$averageSales",
        },
      },
    ]);
    res.status(200).json({ success: true, averageSalesPerProduct });
  } catch (error) {
    console.error("Error calculating average sales per product:", error);
  }
};

exports.calculateTotalSalesPerProduct = async (req, res) => {
  try {
    const totalSalesPerProduct = await Order.aggregate([
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalSales: { $sum: "$orderItems.quantity" },
        },
      },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "productDetails",
        },
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          label: { $arrayElemAt: ["$productDetails.name", 0] },
          value: "$totalSales",
        },
      },
    ]);
    res.status(200).json({ totalSalesPerProduct });
  } catch (error) {
    console.error("Error calculating total sales per product:", error);
  }
};

