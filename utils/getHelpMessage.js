const { EmbedBuilder } = require("discord.js");

// Create and return an EmbedBuilder object for the help message
const getHelpMessage = () => new EmbedBuilder()
  .setTitle("Help")
  .setDescription(`
    **Available Commands:**
    - \`/verify\`: Verify your Bitcoin inscription.
    - \`/help\`: Get help with bot commands.

    **Command Details:**
    **/verify**
    Use this command to verify your Bitcoin inscription.
    \`\`\`
    Usage: /verify <address>
    Example: /verify bc1p...0lhx
    \`\`\`
    **/help**
    Use this command to display this help message.
    \`\`\`
    Usage: /help
    \`\`\`
  `)
  .setColor("#ED9121")
  .setTimestamp();

module.exports = { getHelpMessage };
