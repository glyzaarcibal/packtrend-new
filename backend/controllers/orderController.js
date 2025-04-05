
const User = require("../models/user");
const Order = require("../models/order");
const nodemailer = require("nodemailer");

const getMonthName = (monthNumber) => {
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  return months[monthNumber - 1]; // Adjust index by subtracting 1
};

const sendOrderNotification = async (email, products, order) => {
  //create a nodemailer transport

  const transporter = nodemailer.createTransport({
    //configure the email service
    host: "sandbox.smtp.mailtrap.io",
    port: 2525,
    auth: {
      user: "7392e0157cef10",
      pass: "0710ee17f3f62b",
    },
  });

  //compose the email message
  const mailOptions = {
    from: "glyzamarieparcibal07@gmail.com",
    to: email,
    subject: "Order Notification",
  };
  const productText = products
    .map((product) => `- ${product.name} x${product.quantity}`)
    .join("\n");

  mailOptions.text = `Thank you for ordering from us! \n\nThis is the list of items you've ordered:\n${productText}\n\nPayment Method: ${order.paymentMethod}\nOrder Total:₱ ${order.totalPrice}`;

  //send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending verification email", error);
  }
};

exports.placeOrder = async (req, res, next) => {
  console.log("Order payload received:", req.body);
  try {
    // Handle both data formats (original and updated)
    let cartItems, totalPrice, shippingAddress, paymentMethod;
    
    // Check which format the data is in
    if (req.body.cartItems && req.body.totalPrice) {
      // Original format
      ({ cartItems, totalPrice, shippingAddress, paymentMethod } = req.body);
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
      paymentMethod: paymentMethod
    });

    const savedOrder = await order.save();
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { orders: savedOrder._id } },
      { new: true }
    );
    sendOrderNotification(req.user.email, products, {
      paymentMethod: paymentMethod,
      totalPrice: totalPrice
    });

    res.status(200).json({ 
      message: "Order created successfully!",
      _id: savedOrder._id
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

exports.updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      {
        status: req.body.status
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
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

exports.UpdateStatus = async (req, res) => {
  try {
    // Log the incoming request data for debugging
    console.log("Update status request:", req.body);
    
    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      req.body.item,
      { status: req.body.orderStatus }, // Make sure this field name matches your Order schema
      { new: true }
    );
    
    if (!updatedOrder) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
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

exports.MonthlyIncome = async (req, res) => {
  try {
    const monthlyIncome = await Order.aggregate([
      {
        $match: {
          orderStatus: "Order Received",
        },
      },
      {
        $project: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" },
          totalPrice: "$totalPrice",
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          value: { $sum: "$totalPrice" },
        },
      },
      {
        $project: {
          _id: 0,
          label: {
            $concat: [
              { $toString: "$_id.month" },
              " ",
              { $toString: "$_id.year" },
            ],
          },
          value: 1,
        },
      },
      {
        $sort: { label: 1 },
      },
    ]);

    monthlyIncome.forEach((entry) => {
      entry.label = getMonthName(parseInt(entry.label));
    });

    console.log(monthlyIncome);
    res.status(200).json({ monthlyIncome });
  } catch (error) {
    console.error("Error aggregating monthly income:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
