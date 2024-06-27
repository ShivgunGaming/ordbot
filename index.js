// Imports
const { Client, GatewayIntentBits, REST, Routes, ActivityType } = require("discord.js");
const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = require("./config.json");
const { registerCommands } = require("./commands/registerCommands");
const { handleInteraction } = require("./handlers/interactionHandler");
const { setupLogger } = require("./utils/logger");

// Setup logger
const logger = setupLogger();

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Function to initialize commands
const initializeCommands = async () => {
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  await registerCommands(rest, CLIENT_ID, GUILD_ID, logger);
};

// Client ready event handler
client.once("ready", () => {
  logger.info("Bot started successfully!");
  client.user.setPresence({
    activities: [{ name: "For Verified Bitcoin inscriptions", type: ActivityType.Watching }],
    status: "online",
  });
});

// Client interactionCreate event handler
client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction, logger);
});

// Main function to start the bot
const main = async () => {
  try {
    await initializeCommands();
    await client.login(BOT_TOKEN);
  } catch (error) {
    logger.error("Error starting the bot:", error);
  }
};

// Execute main function
main();
