const { fetchWalletData } = require("./fetchWalletData");
const { REQUIRED_INSCRIPTIONS } = require("../config.json");

// Verify if the wallet contains required inscriptions
const verifyInscriptions = async (bitcoinAddress) => {
  const walletData = await fetchWalletData(bitcoinAddress);
  if (!walletData) throw new Error("Could not fetch wallet data.");
  return walletData.inscriptions?.some(inscription => REQUIRED_INSCRIPTIONS.includes(inscription.id));
};

module.exports = { verifyInscriptions };
