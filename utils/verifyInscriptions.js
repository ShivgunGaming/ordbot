const { fetchWalletData } = require("./fetchWalletData");
const { REQUIRED_INSCRIPTIONS } = require("../config.json");

const verifyInscriptions = async (bitcoinAddress) => {
  try {
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData) {
      throw new Error("Could not fetch wallet data.");
    }
    return walletData.inscriptions?.some(inscription => REQUIRED_INSCRIPTIONS.includes(inscription.id));
  } catch (error) {
    throw new Error(`Error in verifyInscriptions: ${error.message}`);
  }
};

module.exports = { verifyInscriptions };
