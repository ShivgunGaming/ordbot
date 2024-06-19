// Import required modules and configurations
const { Client, GatewayIntentBits, REST, Routes, ActivityType } = require("discord.js");
const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = require("./config.json");
const { registerCommands } = require("./commands/registerCommands");
const { handleInteraction } = require("./handlers/interactionHandler");
const { setupLogger } = require("./utils/logger");

// Initialize a new Discord client with specific intents
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const logger = setupLogger();

// Register commands with Discord
const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
registerCommands(rest, CLIENT_ID, GUILD_ID, logger);

// Event listener for when the bot is ready
client.once("ready", () => {
  console.log("Bot is online!");
  logger.info("Bot started successfully!");
  client.user.setPresence({
    activities: [{ name: "For Verified Bitcoin inscriptions", type: ActivityType.Watching }],
    status: "online",
  });
});

// Event listener for handling interactions (commands)
client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction, logger);
});

// Login to Discord with the bot token
client.login(BOT_TOKEN);
