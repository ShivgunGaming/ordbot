const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActivityType,
  MessageActionRow,
  MessageButton,
} = require("discord.js");
const axios = require("axios");
const winston = require("winston");
const { Sequelize, DataTypes } = require("sequelize");
const crypto = require("crypto");
const {
  BOT_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  ROLE_ID,
  ORDINALS_API_URL,
  LOG_CHANNEL_ID,
  REQUIRED_INSCRIPTIONS,
} = require("./config.json");

// Initialize Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Initialize Sequelize for database
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});

// Define User model
const User = sequelize.define("User", {
  discordId: { type: DataTypes.STRING, primaryKey: true },
  bitcoinAddress: { type: DataTypes.STRING, allowNull: false },
  inscriptionId: { type: DataTypes.STRING, allowNull: false },
  otp: { type: DataTypes.STRING, allowNull: false },
});
sequelize.sync().then(() => console.log("Database synced!"))
  .catch(error => console.error('Error syncing database:', error));

// Configure Winston logger
const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(
      ({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`
    )
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "bot.log" }),
  ],
});

// Utility functions
const fetchWalletData = async (bitcoinAddress) => {
  try {
    const { data } = await axios.get(
      `${ORDINALS_API_URL}/wallet/${bitcoinAddress}`
    );
    return data;
  } catch (error) {
    logger.error(
      `Error fetching wallet data for ${bitcoinAddress}: ${error.message}`
    );
    return null;
  }
};

const verifyInscriptions = async (bitcoinAddress, requiredInscriptions) => {
  const walletData = await fetchWalletData(bitcoinAddress);
  if (!walletData) throw new Error("Could not fetch wallet data.");
  return walletData.inscriptions?.some((inscription) =>
    requiredInscriptions.includes(inscription.id)
  );
};

const generateOTP = () => crypto.randomBytes(3).toString("hex");

const removeRole = async (guild, userId) => {
  try {
    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(ROLE_ID);
    if (role) await member.roles.remove(role);
  } catch (error) {
    logger.error(`Error removing role: ${error.message}`);
  }
};

const getHelpMessage = () =>
  new EmbedBuilder()
    .setTitle("Help")
    .setDescription(
      `
    **Available Commands:**
    - /verify: Verify your Bitcoin inscription.
    - /remove-verification: Remove a user's verification.
  `
    )
    .setColor("#00FF00");

const replyWithError = async (interaction, errorMessage) => {
  const errorMsg =
    errorMessage ||
    "An error occurred while processing your command. Please try again later.";
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: errorMsg, ephemeral: true });
    } else {
      await interaction.reply({ content: errorMsg, ephemeral: true });
    }
  } catch (error) {
    logger.error(`Error replying with error message: ${error.message}`);
  }
};

// Command Handlers
const handleVerify = async (interaction, bitcoinAddress) => {
  await interaction.deferReply({ ephemeral: true });
  try {
    if (!bitcoinAddress)
      return await replyWithError(
        interaction,
        "Invalid Bitcoin address. Please provide a valid address."
      );
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData?.inscriptions?.length)
      return await replyWithError(
        interaction,
        "No inscriptions found in your wallet."
      );
    if (!(await verifyInscriptions(bitcoinAddress, REQUIRED_INSCRIPTIONS))) {
      await removeRole(interaction.guild, interaction.user.id);
      return await interaction.editReply(
        "You do not hold any of the required inscriptions."
      );
    }
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    let role =
      guild.roles.cache.get(ROLE_ID) ||
      (await guild.roles.create({ name: "Verified", color: "BLUE" }));
    await member.roles.add(role);
    
    // Store user information in the database
    await User.upsert({
      discordId: interaction.user.id,
      bitcoinAddress: bitcoinAddress,
      inscriptionId: walletData.inscriptions.map(insc => insc.id).join(','),
      otp: generateOTP()
    });

    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("User Verified")
            .setDescription(
              `<@${interaction.user.id}> has been verified and assigned the Verified role.`
            )
            .setColor("BLUE")
            .setTimestamp(),
        ],
      });
    }
    await interaction.editReply("Role assigned! You are now verified.");
  } catch (error) {
    logger.error(`Error during verification process: ${error.message}`);
    await replyWithError(
      interaction,
      "An error occurred while processing your verification. Please try again later."
    );
  }
};

const handleRemoveVerification = async (interaction, user) => {
  try {
    const guild = interaction.guild;
    await removeRole(guild, user.id);
    await User.destroy({ where: { discordId: user.id } });
    await interaction.reply(`Verification removed for ${user.tag}.`);
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Verification Removed")
            .setDescription(`<@${user.id}> has had their verification removed.`)
            .setColor("RED")
            .setTimestamp(),
        ],
      });
    }
  } catch (error) {
    logger.error(`Error removing verification: ${error.message}`);
    await replyWithError(
      interaction,
      "An error occurred while processing your command. Please try again later."
    );
  }
};

// Command cooldowns map
const cooldowns = new Map();
const handleCooldown = (commandName, userId) => {
  if (!cooldowns.has(commandName)) cooldowns.set(commandName, new Map());
  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = 3000; // 3 seconds cooldown
  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      throw new Error(
        `Please wait ${
          (expirationTime - now) / 1000
        } more seconds before reusing the \`${commandName}\` command.`
      );
    }
  }
  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
};

// Application commands definition
const commands = [
  {
    name: "verify",
    description: "Verify your Bitcoin inscription",
    options: [
      {
        name: "address",
        type: ApplicationCommandOptionType.String,
        description: "Your Bitcoin address",
        required: false,
      },
    ],
  },
  { name: "help", description: "Get help with bot commands" },
  {
    name: "remove-verification",
    description: "Remove a user's verification",
    options: [
      {
        name: "user",
        type: ApplicationCommandOptionType.User,
        description: "The user to remove verification from",
        required: true,
      },
    ],
  },
];

// Initialize REST API
const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);
(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error("Error registering commands:", error.message);
  }
})();

// Bot ready event
client.once("ready", () => {
  console.log("Bot is online!");
  logger.info("Bot started successfully!");
  client.user.setPresence({
    activities: [
      {
        name: "For Verified Bitcoin inscriptions",
        type: ActivityType.Watching,
      },
    ],
    status: "online",
  });
});

// Handle interactions with commands
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  const { commandName, options, user } = interaction;
  try {
    handleCooldown(commandName, user.id);
    const commandHandlers = {
      verify: () => handleVerify(interaction, options.getString("address")),
      help: () => interaction.reply({ embeds: [getHelpMessage()] }),
      "remove-verification": () =>
        handleRemoveVerification(interaction, options.getUser("user")),
    };
    await commandHandlers[commandName]();
  } catch (error) {
    logger.error(`Error handling command ${commandName}: ${error.message}`);
    await replyWithError(interaction,
      "An error occurred while processing your command. Please try again later."
    );
  }
});

// Login to Discord with the bot token
client.login(BOT_TOKEN);
