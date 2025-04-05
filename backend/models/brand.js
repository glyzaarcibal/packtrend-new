const mongoose = require('mongoose')

const brandSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter brand name']
    },
    description: {
        type: String,
        required: [true, 'Please enter brand description'],
    },
    images: [{
        type: String
    }],
})

const Brand = mongoose.model("Brand", brandSchema);

module.exports = Brand