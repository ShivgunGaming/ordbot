const { fetchWalletData } = require("../utils/fetchWalletData");
const { verifyInscriptions } = require("../utils/verifyInscriptions");
const { generateOTP } = require("../utils/generateOTP");
const { removeRole } = require("../utils/removeRole");
const { replyWithError } = require("../utils/replyWithError");
const { User } = require("../models/user");
const { ROLE_ID, LOG_CHANNEL_ID } = require("../config.json");
const { EmbedBuilder } = require("discord.js");

const handleVerify = async (interaction, bitcoinAddress, logger) => {
  try {
    await interaction.deferReply({ ephemeral: true });

    if (!bitcoinAddress) {
      return replyWithError(interaction, "Invalid Bitcoin address. Please provide a valid address.");
    }

    const walletData = await fetchWalletData(bitcoinAddress);
    const hasInscriptions = walletData?.inscriptions?.length;
    const inscriptionsVerified = await verifyInscriptions(bitcoinAddress);

    if (!hasInscriptions || !inscriptionsVerified) {
      await removeRole(interaction.guild, interaction.user.id);
      return replyWithError(interaction, "No inscriptions found in your wallet or you do not hold required inscriptions.");
    }

    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    let role = guild.roles.cache.get(ROLE_ID);

    if (!role) {
      role = await guild.roles.create({ name: "Verified", color: "BLUE" });
    }

    await member.roles.add(role);

    await User.upsert({
      discordId: interaction.user.id,
      bitcoinAddress: bitcoinAddress,
      inscriptionId: walletData.inscriptions.map(insc => insc.id).join(','),
      otp: generateOTP()
    });

    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      const embed = new EmbedBuilder()
        .setTitle("User Verified")
        .setDescription(`<@${interaction.user.id}> has been verified and assigned the Verified role.`)
        .setColor("BLUE")
        .setTimestamp();

      await logChannel.send({ embeds: [embed] });
    }

    await interaction.editReply("Role assigned! You are now verified.");
  } catch (error) {
    logger.error(`Error during verification process: ${error.message}`);
    await replyWithError(interaction, "An error occurred while processing your verification. Please try again later.");
  }
};

module.exports = { handleVerify };
