const express = require("express");
const router = express.Router();

const checkoutController = require("./modules/checkout/checkout_controller");
const AuthController = require("./controllers/auth_controller");

// ===== AUTH ROUTES =====
router.get("/auth/login", AuthController.showLogin);
router.post("/auth/login", AuthController.login);
router.get("/auth/register", AuthController.showRegister);
router.post("/auth/register", AuthController.register);
router.get("/auth/logout", AuthController.logout);

// ===== CHECKOUT ROUTES =====
router.get("/checkout", AuthController.requireLogin, checkoutController.index);
router.post("/checkout", AuthController.requireLogin, checkoutController.checkout);
router.get("/checkout/success", AuthController.requireLogin, checkoutController.success);

module.exports = router;