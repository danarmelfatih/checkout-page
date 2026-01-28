const express = require("express");
const router = express.Router();

const productController = require("./modules/product/product_controller");
const upsellController = require("./modules/upsell/upsell_controller");

// Product Routes
router.get("/get_product/:slug_or_id", productController.getProduct);

// Upsell Routes
router.get("/get_upsell/:slug_or_id", upsellController.getUpsell);

module.exports = router;