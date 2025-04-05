const express = require('express');
const router = express.Router();
const upload = require('../utils/multer');

const BrandController = require('../controllers/BrandController');

router.post('/create/brand', upload.array('images'), BrandController.createBrand);
router.get('/get/brand', BrandController.allBrand)
router.get('/get/single/brand/:id', BrandController.getSingleBrand)
router.put('/update/brand/:id',upload.array('images'), BrandController.updateBrand )
router.delete('/delete/brand/:id', BrandController.deleteBrand)

module.exports = router;