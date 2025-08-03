const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    lowercase: true,
    trim: true
  },
  otp: {
    type: String,
    required: [true, "OTP is required"],
    length: 6
  },
  purpose: {
    type: String,
    required: true,
    enum: ['signup', 'login', 'password_reset'],
    default: 'signup'
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  isUsed: {
    type: Boolean,
    default: false
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
    index: { expireAfterSeconds: 0 } // MongoDB TTL index
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for performance
otpSchema.index({ email: 1, purpose: 1 });
otpSchema.index({ createdAt: 1 }, { expireAfterSeconds: 600 }); // Auto-delete after 10 minutes

// Static method to generate OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
};

// Static method to verify OTP
otpSchema.statics.verifyOTP = async function(email, otp, purpose = 'signup') {
  const otpRecord = await this.findOne({
    email: email.toLowerCase(),
    otp,
    purpose,
    isUsed: false,
    expiresAt: { $gt: new Date() }
  });

  if (!otpRecord) {
    return { success: false, message: "Invalid or expired OTP" };
  }

  if (otpRecord.attempts >= 3) {
    return { success: false, message: "Maximum verification attempts exceeded" };
  }

  // Mark as used
  otpRecord.isUsed = true;
  await otpRecord.save();

  return { success: true, message: "OTP verified successfully" };
};

// Static method to clean expired OTPs
otpSchema.statics.cleanExpired = function() {
  return this.deleteMany({
    $or: [
      { expiresAt: { $lt: new Date() } },
      { isUsed: true }
    ]
  });
};

module.exports = mongoose.model("OTP", otpSchema);