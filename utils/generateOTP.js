const crypto = require("crypto");

// Generate a random OTP using crypto
const generateOTP = () => crypto.randomBytes(3).toString("hex");

module.exports = { generateOTP };
