const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  ApplicationCommandOptionType,
  EmbedBuilder,
  ActivityType,
} = require("discord.js");
const axios = require("axios");
const fs = require("fs");
const winston = require("winston");
const { Sequelize, DataTypes } = require("sequelize");
const {
  BOT_TOKEN,
  CLIENT_ID,
  GUILD_ID,
  ROLE_ID,
  ORDINALS_API_URL,
  LOG_CHANNEL_ID,
  REQUIRED_INSCRIPTIONS,
} = require("./config.json");
const crypto = require("crypto");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite",
});
const User = sequelize.define("User", {
  discordId: { type: DataTypes.STRING, primaryKey: true },
  bitcoinAddress: { type: DataTypes.STRING, allowNull: false },
  inscriptionId: { type: DataTypes.STRING, allowNull: false },
  otp: { type: DataTypes.STRING, allowNull: false },
});
sequelize.sync().then(() => console.log("Database synced!"));

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
        - /list-verified: List all verified users.
        - /remove-verification: Remove a user's verification.
    `
    )
    .setColor("#00FF00");

    const replyWithError = async (interaction, errorMessage) => {
        const errorMsg =
          errorMessage ||
          "An error occurred while processing your command. Please try again later.";
      
        // Check if the interaction is a slash command and if it's replied or deferred
        if (interaction.isCommand() && (!interaction.replied || !interaction.deferred)) {
          // Check the type of error and provide specific feedback
          switch (errorMsg) {
            case "INVALID_ADDRESS":
              await interaction.reply({ content: "Invalid Bitcoin address. Please provide a valid address.", ephemeral: true });
              break;
            case "NO_INSCRIPTIONS":
              await interaction.reply({ content: "No inscriptions found in your wallet.", ephemeral: true });
              break;
            // Add more cases for specific errors as needed
            default:
              await interaction.reply({ content: errorMsg, ephemeral: true });
              break;
          }
        } else {
          // Reply or edit the original message based on interaction type
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: errorMsg, ephemeral: true });
          } else if (interaction.deferred) {
            await interaction.editReply(errorMsg);
          }
        }
      };      

const handleVerify = async (interaction, bitcoinAddress) => {
  await interaction.deferReply({ ephemeral: true });

  try {
    // Fetch wallet data
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData?.inscriptions?.length) {
      return await interaction.editReply(
        "No inscriptions found in your wallet."
      );
    }

    // Check for required inscriptions
    if (!(await verifyInscriptions(bitcoinAddress, REQUIRED_INSCRIPTIONS))) {
      await removeRole(interaction.guild, interaction.user.id);
      return await interaction.editReply(
        "You do not hold any of the required inscriptions."
      );
    }

    // Assign verified role
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    let role =
      guild.roles.cache.get(ROLE_ID) ||
      (await guild.roles.create({ name: "Verified", color: "BLUE" }));
    await member.roles.add(role);

    // Log the verification
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

const handleListVerified = async (interaction) => {
  try {
    const verifiedUsers = await User.findAll({
      attributes: ["discordId", "bitcoinAddress"],
    });
    if (!verifiedUsers.length)
      return await interaction.reply("No verified users found.");
    const userList = verifiedUsers
      .map(
        (user) =>
          `<@${user.discordId}> - Bitcoin Address: ${user.bitcoinAddress}`
      )
      .join("\n");
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("Verified Users")
          .setDescription(userList)
          .setColor("#0000FF"),
      ],
    });
  } catch (error) {
    logger.error(`Error listing verified users: ${error.message}`);
    await replyWithError(
      interaction,
      "An error occurred while processing your command. Please try again later."
    );
  }
};

const handleRemoveVerification = async (interaction, user) => {
  try {
    const guild = interaction.guild;
    const member = await guild.members.fetch(user.id);
    await removeRole(guild, user.id);
    await User.destroy({ where: { discordId: user.id } });
    await interaction.reply(`Verification removed for ${user.tag}.`);
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel)
      await logChannel.send({
        embeds: [
          new EmbedBuilder()
            .setTitle("Verification Removed")
            .setDescription(`<@${user.id}> has had their verification removed.`)
            .setColor("RED")
            .setTimestamp(),
        ],
      });
  } catch (error) {
    logger.error(`Error removing verification: ${error.message}`);
    await replyWithError(
      interaction,
      "An error occurred while processing your command. Please try again later."
    );
  }
};

const cooldowns = new Map();

const handleCooldown = (commandName, userId, interaction) => {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Map());
  }

  const now = Date.now();
  const timestamps = cooldowns.get(commandName);
  const cooldownAmount = 3000; // 3 seconds cooldown

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      throw new Error(
        `Please wait ${timeLeft.toFixed(
          1
        )} more seconds before reusing the \`${commandName}\` command.`
      );
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
};

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
  { name: "list-verified", description: "List all verified users" },
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

const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

(async () => {
  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error("Error reloading commands:", error.message);
  }
})();

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

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, options, user } = interaction;

  try {
    handleCooldown(commandName, user.id, interaction);

    const commandHandlers = {
      verify: async () =>
        await handleVerify(
          interaction,
          options.getString("address"),
          options.getString("otp")
        ),
      help: async () => await interaction.reply({ embeds: [getHelpMessage()] }),
      "list-verified": async () => await handleListVerified(interaction),
      "remove-verification": async () =>
        await handleRemoveVerification(interaction, options.getUser("user")),
    };

    await commandHandlers[commandName]();
  } catch (error) {
    logger.error(`Error handling command ${commandName}: ${error.message}`);
    await replyWithError(
      interaction,
      "An error occurred while processing your command. Please try again later."
    );
  }
});

client.login(BOT_TOKEN);
