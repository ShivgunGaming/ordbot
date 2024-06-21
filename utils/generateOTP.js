const crypto = require("crypto");

// Function to generate a random OTP
const generateOTP = () => {
  const bytes = crypto.randomBytes(3); // Generate 3 random bytes
  const otp = bytes.toString("hex"); // Convert bytes to hex string
  return otp;
};

module.exports = { generateOTP };
