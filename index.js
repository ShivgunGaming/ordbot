// Import required modules and configurations
const { Client, GatewayIntentBits, REST, Routes, ActivityType } = require("discord.js");
const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = require("./config.json");
const { registerCommands } = require("./commands/registerCommands");
const { handleInteraction } = require("./handlers/interactionHandler");
const { setupLogger } = require("./utils/logger");

// Initialize logger
const logger = setupLogger();

// Initialize a new Discord client with specific intents
const initializeClient = () => {
  return new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });
};

// Register commands with Discord
const initializeCommands = async () => {
  const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
  await registerCommands(rest, CLIENT_ID, GUILD_ID, logger);
};

// Set bot presence
const setBotPresence = (client) => {
  client.user.setPresence({
    activities: [{ name: "For Verified Bitcoin inscriptions", type: ActivityType.Watching }],
    status: "online",
  });
};

// Handle bot ready event
const onBotReady = (client) => {
  client.once("ready", () => {
    logger.info("Bot started successfully!");
    setBotPresence(client);
  });
};

// Handle interaction create event
const onInteractionCreate = (client) => {
  client.on("interactionCreate", async (interaction) => {
    await handleInteraction(interaction, logger);
  });
};

// Main function to initialize and start the bot
const main = async () => {
  const client = initializeClient();
  await initializeCommands();
  onBotReady(client);
  onInteractionCreate(client);
  client.login(BOT_TOKEN);
};

// Start the bot
main().catch(error => {
  logger.error("Error starting the bot:", error);
});
