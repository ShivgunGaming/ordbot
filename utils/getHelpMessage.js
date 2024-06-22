const { EmbedBuilder } = require("discord.js");

// Function to get the usage details for a specific command
const getCommandUsage = (command, description, usage, example = null) => `
  **${command}**
  ${description}
  \`\`\`
  Usage: ${usage}
  ${example ? `Example: ${example}` : ""}
  \`\`\`
`;

// Create and return an EmbedBuilder object for the help message
const getHelpMessage = () => {
  const commandsList = `
    **Available Commands:**
    - \`/verify\`: Verify your Bitcoin inscription.
    - \`/help\`: Get help with bot commands.
  `;

  const commandDetails = `
    **Command Details:**
    ${getCommandUsage("/verify", "Use this command to verify your Bitcoin inscription.", "/verify <address>", "bc1p...0lhx")}
    ${getCommandUsage("/help", "Use this command to display this help message.", "/help")}
  `;

  return new EmbedBuilder()
    .setTitle("Help")
    .setDescription(`${commandsList}${commandDetails}`)
    .setColor("#ED9121")
    .setTimestamp();
};

module.exports = { getHelpMessage };
