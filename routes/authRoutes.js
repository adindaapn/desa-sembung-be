const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

// Jalur untuk login: http://localhost:5000/api/auth/login
router.post("/login", authController.login);
router.post("/register", authController.register);
router.post("/send-otp", authController.sendOTP);
router.post("/reset-password-otp", authController.resetPasswordWithOTP);
router.get("/profile/:id", authController.getProfile);
router.get("/warga", authController.getAllWarga);
router.put("/profile/:id", authController.updateProfile);

module.exports = router;
