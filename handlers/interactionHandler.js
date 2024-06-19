const { getHelpMessage } = require("../utils/getHelpMessage");
const { replyWithError } = require("../utils/replyWithError");
const { handleVerify } = require("../commands/verify");

const handleInteraction = async (interaction, logger) => {
  if (!interaction.isCommand()) return;
  const { commandName, options, user } = interaction;

  try {
    handleCooldown(commandName, user.id);

    const commandHandlers = {
      verify: () => handleVerify(interaction, options.getString("address"), logger),
      help: () => interaction.reply({ embeds: [getHelpMessage()] }),
    };

    if (commandHandlers[commandName]) {
      await commandHandlers[commandName]();
    } else {
      throw new Error("Unknown command");
    }
  } catch (error) {
    logger.error(`Error handling command ${commandName}: ${error.message}`);
    await replyWithError(interaction);
  }
};

const cooldowns = new Map();

const handleCooldown = (commandName, userId) => {
  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = 3000; // 3 seconds cooldown

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      throw new Error(`Please wait ${(expirationTime - now) / 1000} more seconds before reusing the \`${commandName}\` command.`);
    }
  }
  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
};

module.exports = { handleInteraction };
