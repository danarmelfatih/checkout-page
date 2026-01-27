const express = require("express");
const router = express.Router();

const checkoutController = require("./modules/checkout/checkout_controller");

// Route untuk halaman checkout
router.get("/checkout", checkoutController.index);

// Route untuk halaman success
router.get("/checkout/success", checkoutController.success);

module.exports = router;