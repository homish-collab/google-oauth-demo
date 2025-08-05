const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { OAuth2Client } = require("google-auth-library");

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// JWT creator
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// SIGNUP
exports.signup = async (req, res) => {
  try {
    const { username, fullName, collegeName, rollNumber, email, password } = req.body;

    if (!username || !fullName || !collegeName || !email || !password) {
      return res.status(400).json({ message: "Please fill all required fields" });
    }

    // Email check
    const existingEmail = await User.findOne({ email });
    if (existingEmail) return res.status(400).json({ message: "Email already exists" });

    // Username check
    const existingUsername = await User.findOne({ username });
    if (existingUsername) return res.status(400).json({ message: "Username already taken" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      fullName,
      collegeName,
      rollNumber,
      email,
      password: hashedPassword
    });

    const token = createToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        username: newUser.username,
        fullName: newUser.fullName,
        collegeName: newUser.collegeName,
        rollNumber: newUser.rollNumber,
        email: newUser.email
      }
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ message: "Signup error", error: err.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = createToken(user);
    res.status(200).json({ token, user });
  } catch (err) {
    res.status(500).json({ message: "Login error", error: err.message });
  }
};

// GOOGLE LOGIN
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { name, email, sub: googleId } = payload;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ fullName: name, email, googleId });
    }

    const token = createToken(user);
    res.status(200).json({ token, user });
  } catch (error) {
    console.error("❌ Google Login Error:", error);
    res.status(401).json({ message: "Google login failed", error: error.message });
  }
};
