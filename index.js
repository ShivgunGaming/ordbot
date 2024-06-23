const { Client, GatewayIntentBits, REST, Routes, ActivityType } = require("discord.js");
const { BOT_TOKEN, CLIENT_ID, GUILD_ID } = require("./config.json");
const { registerCommands } = require("./commands/registerCommands");
const { handleInteraction } = require("./handlers/interactionHandler");
const { setupLogger } = require("./utils/logger");

const logger = setupLogger();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const initializeCommands = async () => {
  await registerCommands(new REST({ version: "10" }).setToken(BOT_TOKEN), CLIENT_ID, GUILD_ID, logger);
};

client.once("ready", () => {
  logger.info("Bot started successfully!");
  client.user.setPresence({
    activities: [{ name: "For Verified Bitcoin inscriptions", type: ActivityType.Watching }],
    status: "online",
  });
});

client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction, logger);
});

const main = async () => {
  await initializeCommands();
  await client.login(BOT_TOKEN);
};

main().catch(error => {
  logger.error("Error starting the bot:", error);
});
