const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  collegeName: { type: String, required: true },
  rollNumber: { type: String }, // optional
  email: { type: String, required: true, unique: true },
  password: String,
  googleId: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("User", userSchema);
