const express = require("express");
const router = express.Router();
const { 
  signup, 
  login, 
  googleLogin, 
  sendOTP, 
  verifyOTP, 
  completeGoogleSignup 
} = require("../controllers/authController");

// Traditional auth routes
router.post("/signup", signup);
router.post("/login", login);

// Google OAuth routes
router.post("/google-login", googleLogin);
router.post("/complete-google-signup", completeGoogleSignup);

// OTP routes
router.post("/send-otp", sendOTP);
router.post("/verify-otp", verifyOTP);

module.exports = router;
