const winston = require("winston");

// Reply with an error message to the interaction
const replyWithError = async (interaction, errorMessage = "An error occurred while processing your command. Please try again later.") => {
  try {
    const method = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
    await interaction[method]({ content: errorMessage, ephemeral: true });
  } catch (error) {
    winston.error(`Error replying with error message: ${error.message}`);
  }
};

module.exports = { replyWithError };
