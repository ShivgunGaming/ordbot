const { EmbedBuilder } = require("discord.js");

// Command details configuration
const commands = [
  {
    command: "/verify",
    description: "Use this command to verify your Bitcoin inscription.",
    usage: "/verify <address>",
    example: "bc1p...0lhx"
  },
  {
    command: "/help",
    description: "Use this command to display this help message.",
    usage: "/help"
  }
];

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
 * Initialize an EmbedBuilder object.
 * 
 * @param {string} title - The title of the embed.
 * @param {string} description - The description of the embed.
 * @returns {EmbedBuilder} - The initialized EmbedBuilder object.
 */
const createEmbedBuilder = (title, description) => new EmbedBuilder()
  .setTitle(title)
  .setDescription(description)
  .setColor("#ED9121")
  .setTimestamp();

/**
 * Create and return an EmbedBuilder object for the help message.
 * 
 * @returns {EmbedBuilder} - The EmbedBuilder object with help message details.
 */
const getHelpMessage = () => {
  const commandDetails = commands.map(({ command, description, usage, example }) =>
    getCommandUsage(command, description, usage, example)
  ).join("\n");

  const description = `
    **Available Commands:**
    - \`/verify\`: Verify your Bitcoin inscription.
    - \`/help\`: Get help with bot commands.

    **Command Details:**
    ${commandDetails}
  `;

  return createEmbedBuilder("Help", description);
};

module.exports = { getHelpMessage };
