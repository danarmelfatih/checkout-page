const express = require("express");
const router = express.Router();

const productController = require("./modules/product/product_controller");
const upsellController = require("./modules/upsell/upsell_controller");
const whatsappController = require("./modules/whatsapp/whatsapp_controller");
const checkoutController = require("./modules/checkout/checkout_controller");

// Product Routes
router.get("/get_product/:slug_or_id", productController.getProduct);

// Upsell Routes
router.get("/get_upsell/:slug_or_id", upsellController.getUpsell);

// WhatsApp Routes
router.get("/cek_valid/:no_wa", whatsappController.cek_valid);
router.post("/send_wa", whatsappController.send_wa);

//checkout
router.post("/checkout", checkoutController.checkout);

module.exports = router;