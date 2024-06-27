const { EmbedBuilder } = require("discord.js");

/**
 * Generate usage details for a specific command.
 * 
 * @param {string} command - The command name.
 * @param {string} description - The command description.
 * @param {string} usage - The usage information for the command.
 * @param {string|null} example - An example usage of the command.
 * @returns {string} - Formatted command usage details.
 */
const getCommandUsage = (command, description, usage, example = null) => `
  **${command}**
  ${description}
  \`\`\`
  Usage: ${usage}
  ${example ? `Example: ${example}` : ""}
  \`\`\`
`;

/**
 * Create and return an EmbedBuilder object for the help message.
 * 
 * @returns {EmbedBuilder} - The EmbedBuilder object with help message details.
 */
const getHelpMessage = () => new EmbedBuilder()
  .setTitle("Help")
  .setDescription(`
    **Available Commands:**
    - \`/verify\`: Verify your Bitcoin inscription.
    - \`/help\`: Get help with bot commands.

    **Command Details:**
    ${getCommandUsage("/verify", "Use this command to verify your Bitcoin inscription.", "/verify <address>", "bc1p...0lhx")}
    ${getCommandUsage("/help", "Use this command to display this help message.", "/help")}
  `)
  .setColor("#ED9121")
  .setTimestamp();

module.exports = { getHelpMessage };
