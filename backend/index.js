const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const cors = require("cors");
const brandRoutes = require('./routes/brandRoutes');
const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");
const orderRoutes = require("./routes/orderRoutes");

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use("/public/uploads", express.static(__dirname + "/public/uploads"));

app.use('/api/v1/', brandRoutes);
app.use('/api/v1/', userRoutes);
app.use('/api/v1/', productRoutes);
app.use('/api/v1/', orderRoutes);

module.exports = app