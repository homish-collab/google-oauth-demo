const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/userModel");
const OTP = require("../models/otpModel");
const { OAuth2Client } = require("google-auth-library");
const { sendOTPEmail } = require("../services/emailService");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Validation schemas
const signupSchema = Joi.object({
  name: Joi.string().min(2).max(50).required().trim(),
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().min(8).max(128).required()
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .message('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  password: Joi.string().required()
});

const otpVerificationSchema = Joi.object({
  email: Joi.string().email().required().lowercase().trim(),
  otp: Joi.string().length(6).pattern(/^\d+$/).required(),
  purpose: Joi.string().valid('signup', 'login', 'password_reset').default('signup')
});

const createToken = (user) => {
  return jwt.sign(
    { 
      id: user._id, 
      email: user.email,
      name: user.name 
    }, 
    process.env.JWT_SECRET, 
    {
      expiresIn: "24h",
      issuer: "google-oauth-demo",
      audience: "google-oauth-demo-users"
    }
  );
};

const handleAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Send OTP for email verification
exports.sendOTP = handleAsync(async (req, res) => {
  const { error, value } = Joi.object({
    email: Joi.string().email().required().lowercase().trim(),
    purpose: Joi.string().valid('signup', 'login', 'password_reset').default('signup')
  }).validate(req.body);

  if (error) {
    return res.status(400).json({ 
      message: "Validation error", 
      details: error.details.map(detail => detail.message)
    });
  }

  const { email, purpose } = value;

  // For signup, check if user already exists
  if (purpose === 'signup') {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "User already exists with this email" });
    }
  }

  // For login, check if user exists
  if (purpose === 'login') {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email" });
    }
  }

  // Delete any existing OTPs for this email and purpose
  await OTP.deleteMany({ email, purpose });

  // Generate new OTP
  const otp = OTP.generateOTP();
  
  // Save OTP to database
  await OTP.create({
    email,
    otp,
    purpose,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
  });

  // Send OTP email
  const emailResult = await sendOTPEmail(email, otp, purpose);
  
  if (!emailResult.success) {
    // Clean up OTP if email failed
    await OTP.deleteOne({ email, otp, purpose });
    return res.status(500).json({ 
      message: "Failed to send verification email", 
      error: emailResult.message 
    });
  }

  res.status(200).json({ 
    message: "OTP sent successfully to your email",
    expiresIn: "10 minutes"
  });
});

// Verify OTP
exports.verifyOTP = handleAsync(async (req, res) => {
  const { error, value } = otpVerificationSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: "Validation error", 
      details: error.details.map(detail => detail.message)
    });
  }

  const { email, otp, purpose } = value;

  // Verify OTP
  const verification = await OTP.verifyOTP(email, otp, purpose);
  
  if (!verification.success) {
    // Increment attempt count
    await OTP.updateOne(
      { email, otp, purpose, isUsed: false },
      { $inc: { attempts: 1 } }
    );
    
    return res.status(400).json({ message: verification.message });
  }

  res.status(200).json({ 
    message: verification.message,
    verified: true
  });
});

exports.signup = handleAsync(async (req, res) => {
  // Validate input
  const { error, value } = signupSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: "Validation error", 
      details: error.details.map(detail => detail.message)
    });
  }

  const { name, email, password } = value;
  
  // Check if user already exists
  const existing = await User.findOne({ email });
  if (existing) {
    return res.status(409).json({ message: "User already exists with this email" });
  }

  // Hash password with higher salt rounds
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Create user
  const newUser = await User.create({ 
    name, 
    email, 
    password: hashedPassword 
  });

  // Remove password from response
  const userResponse = {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    createdAt: newUser.createdAt
  };

  const token = createToken(newUser);
  
  res.status(201).json({ 
    message: "User created successfully",
    token, 
    user: userResponse 
  });
});

exports.login = handleAsync(async (req, res) => {
  // Validate input
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ 
      message: "Validation error", 
      details: error.details.map(detail => detail.message)
    });
  }

  const { email, password } = value;
  
  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  // Update last login
  await user.updateLastLogin();

  // Remove password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };

  const token = createToken(user);
  
  res.status(200).json({ 
    message: "Login successful",
    token, 
    user: userResponse 
  });
});

exports.googleLogin = handleAsync(async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Google credential is required" });
  }

  // Verify Google token
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { name, email, sub: googleId, email_verified } = payload;

  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified with Google" });
  }

  // Check if this is a new user (signup via Google)
  let user = await User.findOne({ email });
  let isNewUser = false;

  if (!user) {
    // New user - send OTP for verification
    isNewUser = true;
    
    // Delete any existing OTPs for this email
    await OTP.deleteMany({ email, purpose: 'signup' });

    // Generate new OTP
    const otp = OTP.generateOTP();
    
    // Save OTP to database
    await OTP.create({
      email,
      otp,
      purpose: 'signup',
      expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    });

    // Send OTP email
    const emailResult = await sendOTPEmail(email, otp, 'signup');
    
    if (!emailResult.success) {
      await OTP.deleteOne({ email, otp, purpose: 'signup' });
      return res.status(500).json({ 
        message: "Failed to send verification email", 
        error: emailResult.message 
      });
    }

    return res.status(200).json({
      message: "Verification code sent to your email. Please verify to complete signup.",
      requiresOTP: true,
      email: email,
      purpose: 'signup',
      isNewUser: true
    });
  } else {
    // Existing user
    if (!user.googleId) {
      // Link Google account to existing user
      user.googleId = googleId;
      user.emailVerified = true;
      await user.save();
    }

    // Update last login
    await user.updateLastLogin();

    // Remove sensitive fields from response
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    const token = createToken(user);
    
    return res.status(200).json({ 
      message: "Google login successful",
      token, 
      user: userResponse,
      isNewUser: false
    });
  }
});

// Complete Google signup after OTP verification
exports.completeGoogleSignup = handleAsync(async (req, res) => {
  const { credential, otp } = req.body;

  if (!credential || !otp) {
    return res.status(400).json({ message: "Google credential and OTP are required" });
  }

  // Verify Google token again
  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  const { name, email, sub: googleId, email_verified } = payload;

  if (!email_verified) {
    return res.status(400).json({ message: "Email not verified with Google" });
  }

  // Verify OTP
  const verification = await OTP.verifyOTP(email, otp, 'signup');
  
  if (!verification.success) {
    return res.status(400).json({ message: verification.message });
  }

  // Create user after OTP verification
  const newUser = await User.create({ 
    name, 
    email, 
    googleId,
    emailVerified: true
  });

  // Remove sensitive fields from response
  const userResponse = {
    _id: newUser._id,
    name: newUser.name,
    email: newUser.email,
    emailVerified: newUser.emailVerified,
    createdAt: newUser.createdAt
  };

  const token = createToken(newUser);
  
  res.status(201).json({ 
    message: "Google signup completed successfully",
    token, 
    user: userResponse 
  });
});
