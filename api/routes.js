const express = require("express");
const router = express.Router();

const productController = require("./modules/product/product_controller");

router.get("/get_product/:slug_or_id", productController.getProduct);

module.exports = router;