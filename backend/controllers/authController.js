const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Joi = require("joi");
const User = require("../models/userModel");
const { OAuth2Client } = require("google-auth-library");

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

  // Remove password from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
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

  // Find or create user
  let user = await User.findOne({ email });
  if (!user) {
    user = await User.create({ 
      name, 
      email, 
      googleId,
      emailVerified: true
    });
  } else if (!user.googleId) {
    // Link Google account to existing user
    user.googleId = googleId;
    user.emailVerified = true;
    await user.save();
  }

  // Remove sensitive fields from response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    createdAt: user.createdAt
  };

  const token = createToken(user);
  
  res.status(200).json({ 
    message: "Google login successful",
    token, 
    user: userResponse 
  });
});
