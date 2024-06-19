const axios = require("axios");
const { ORDINALS_API_URL } = require("../config.json");
const winston = require("winston");

// Fetch wallet data from the ORDINALS_API_URL
const fetchWalletData = async (bitcoinAddress) => {
  try {
    const { data } = await axios.get(`${ORDINALS_API_URL}/wallet/${bitcoinAddress}`);
    return data;
  } catch (error) {
    winston.error(`Error fetching wallet data for ${bitcoinAddress}: ${error.message}`);
    return null;
  }
};

module.exports = { fetchWalletData };
