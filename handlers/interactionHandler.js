const { getHelpMessage } = require("../utils/getHelpMessage");
const { replyWithError } = require("../utils/replyWithError");
const { handleVerify } = require("../commands/verify");

const cooldowns = new Map();

const handleCooldown = (commandName, userId) => {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }
  
  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = 3000; // 3 seconds cooldown

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      const remainingTime = (expirationTime - now) / 1000;
      throw new Error(`Please wait ${remainingTime.toFixed(1)} more seconds before reusing the \`${commandName}\` command.`);
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
};

const commandHandlers = {
  verify: async (interaction, logger) => {
    const address = interaction.options.getString("address");
    await handleVerify(interaction, address, logger);
  },
  help: async (interaction) => {
    await interaction.reply({ embeds: [getHelpMessage()] });
  },
};

const handleInteraction = async (interaction, logger) => {
  if (!interaction.isCommand()) return;

  const { commandName, user } = interaction;

  try {
    handleCooldown(commandName, user.id);

    const handler = commandHandlers[commandName];
    if (handler) {
      await handler(interaction, logger);
    } else {
      throw new Error("Unknown command");
    }
  } catch (error) {
    logger.error(`Error handling command ${commandName}: ${error.message}`);
    await replyWithError(interaction);
  }
};

module.exports = { handleInteraction };
