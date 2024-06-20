const axios = require("axios");
const { ORDINALS_API_URL } = require("../config.json");
const winston = require("winston");

// Function to fetch wallet data from ORDINALS_API_URL
const fetchWalletData = async (bitcoinAddress) => {
  try {
    const response = await axios.get(`${ORDINALS_API_URL}/wallet/${bitcoinAddress}`);
    return response.data;
  } catch (error) {
    const errorMessage = `Error fetching wallet data for ${bitcoinAddress}: ${error.message}`;
    winston.error(errorMessage);
    throw new Error(errorMessage); // Re-throw the error to handle it further up the call stack
  }
};

module.exports = { fetchWalletData };
