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
      user: "923f1b4fe759c5",
      pass: "bffdcf9078b243",
    },
  });

  //compose the email message
  const mailOptions = {
    from: "kickz@gmail.com",
    to: email,
    subject: "Order Notification",
  };
  const productText = products
    .map((product) => `- ${product.name} x${product.quantity}`)
    .join("\n");

  mailOptions.text = `Thank you for ordering from kickz! \n\nThis is the list of items you've ordered:\n${productText}\n\nPayment Method: ${order.paymentMethod}\nOrder Total:₱ ${order.totalPrice}`;

  //send the email
  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log("Error sending verification email", error);
  }
};

exports.placeOrder = async (req, res, next) => {
  console.log(req.body);
  try {
    const { cartItems, totalPrice, shippingAddress, paymentMethod } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    //create an array of product objects from the cart Items
    const products = cartItems.map((item) => ({
      id: item?._id,
      name: item?.name,
      quantity: item.quantity,
      price: item.price,
      image: item?.images[0],
    }));

    //create a new Order
    const order = new Order({
      user: req.user._id,
      products: products,
      totalPrice: totalPrice,
      shippingAddress: shippingAddress,
      paymentMethod: paymentMethod,
    });

    await order.save();
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { orders: order._id } },
      { new: true }
    );
    sendOrderNotification(req.user.email, products, order);

    res.status(200).json({ message: "Order created successfully!" });
  } catch (error) {
    console.log("error creating orders", error);
    res.status(500).json({ message: "Error creating orders" });
  }
};

exports.getAllOrder = async (req, res) => {
  const order = await Order.find();
  res.status(200).json({ order });
};

exports.UpdateStatus = async (req, res) => {
  try {
    await Order.findByIdAndUpdate(
      req.body.item,
      { orderStatus: req.body.orderStatus },
      { new: true }
    );
  } catch (err) {
    console.log(err);
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
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.id",
          averageSales: { $avg: "$products.quantity" },
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
      { $unwind: "$products" },
      {
        $group: {
          _id: "$products.id",
          totalSales: { $sum: "$products.quantity" },
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
