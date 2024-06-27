// Imports
const { fetchWalletData } = require("./fetchWalletData");
const { REQUIRED_INSCRIPTIONS } = require("../config.json");

// Function to verify inscriptions
const verifyInscriptions = async (bitcoinAddress) => {
  try {
    const walletData = await fetchWalletData(bitcoinAddress);

    if (!walletData) {
      throw new Error("Could not fetch wallet data.");
    }

    const hasRequiredInscriptions = walletData.inscriptions?.some(inscription =>
      REQUIRED_INSCRIPTIONS.includes(inscription.id)
    );

    return hasRequiredInscriptions;

  } catch (error) {
    throw new Error(`Error in verifyInscriptions: ${error.message}`);
  }
};

// Export the verifyInscriptions function
module.exports = { verifyInscriptions };
