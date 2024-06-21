const winston = require("winston");

// Function to reply with an error message to the interaction
const replyWithError = async (interaction, errorMessage = "An error occurred while processing your command. Please try again later.") => {
  try {
    const replyMethod = interaction.deferred || interaction.replied ? 'editReply' : 'reply';
    await interaction[replyMethod]({ content: errorMessage, ephemeral: true });
  } catch (error) {
    winston.error(`Error replying with error message: ${error.message}`);
  }
};

module.exports = { replyWithError };
