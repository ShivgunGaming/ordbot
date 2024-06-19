const { ApplicationCommandOptionType } = require("discord.js");

const commands = [
  {
    name: "verify",
    description: "Verify your Bitcoin inscription",
    options: [
      {
        name: "address",
        type: ApplicationCommandOptionType.String,
        description: "Your Bitcoin address",
        required: true,
      },
    ],
  },
  {
    name: "help",
    description: "Get help with bot commands",
  },
];

const registerCommands = async (rest, clientId, guildId, logger) => {
  try {
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands });
    console.log("Successfully registered application commands.");
  } catch (error) {
    logger.error("Error registering commands:", error.message);
  }
};

module.exports = { registerCommands };