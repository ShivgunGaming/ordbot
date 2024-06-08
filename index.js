const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType, EmbedBuilder, ActivityType, PermissionsBitField } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const winston = require('winston');
const { Sequelize, DataTypes } = require('sequelize');
const { BOT_TOKEN, CLIENT_ID, GUILD_ID, ROLE_ID, ORDINALS_API_URL, REQUIRED_INSCRIPTIONS, LOG_CHANNEL_ID } = require('./config.json');
const crypto = require('crypto');

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Initialize database
const sequelize = new Sequelize({ dialect: 'sqlite', storage: 'database.sqlite' });
const User = sequelize.define('User', {
    discordId: { type: DataTypes.STRING, primaryKey: true },
    bitcoinAddress: { type: DataTypes.STRING, allowNull: false },
    inscriptionId: { type: DataTypes.STRING, allowNull: false },
    otp: { type: DataTypes.STRING, allowNull: false },
});
sequelize.sync().then(() => console.log('Database synced!'));

// Logger initialization
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'bot.log' })
    ]
});

// Fetch wallet data from external API
const fetchWalletData = async (bitcoinAddress) => {
    const url = `${ORDINALS_API_URL}/wallet/${bitcoinAddress}`;
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        logger.error(`Error fetching wallet data for ${bitcoinAddress}: ${error.message}`);
        return null;
    }
};

// Verify if the wallet contains required inscriptions
const verifyInscriptions = async (bitcoinAddress, requiredInscriptions) => {
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData) throw new Error('Could not fetch wallet data.');
    return walletData.inscriptions?.some(inscription => requiredInscriptions.includes(inscription.id));
};

// Generate a secure OTP
const generateOTP = () => crypto.randomBytes(3).toString('hex');

// Commands definition
const commands = [
    {
        name: 'verify',
        description: 'Verify your Bitcoin inscription',
        options: [{ name: 'address', type: ApplicationCommandOptionType.String, description: 'Your Bitcoin address', required: true }]
    },
    {
        name: 'verify-otp',
        description: 'Verify your OTP',
        options: [{ name: 'otp', type: ApplicationCommandOptionType.String, description: 'The OTP sent to your wallet', required: true }]
    },
    { name: 'help', description: 'Get help with bot commands' },
    { name: 'list-verified', description: 'List all verified users' },
    {
        name: 'remove-verification',
        description: 'Remove a user\'s verification',
        options: [{ name: 'user', type: ApplicationCommandOptionType.User, description: 'The user to remove verification from', required: true }]
    },
    {
        name: 'update-required-inscriptions',
        description: 'Update the list of required inscriptions',
        options: [{ name: 'inscriptions', type: ApplicationCommandOptionType.String, description: 'Comma-separated list of required inscription IDs', required: true }]
    }
];

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
    try {
        await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), { body: commands });
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error('Error reloading commands:', error.message);
    }
})();

// Bot ready event
client.once('ready', () => {
    console.log('Bot is online!');
    logger.info('Bot started successfully!');
    client.user.setPresence({
        activities: [{ name: 'For Verified Bitcoin inscriptions', type: ActivityType.Watching }],
        status: 'online',
    });
});

const cooldowns = new Map();

// Handle command interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options, user } = interaction;

    try {
        handleCooldown(commandName, user.id, interaction);

        switch (commandName) {
            case 'verify':
                await handleVerify(interaction, options.getString('address'));
                break;
            case 'verify-otp':
                await handleVerifyOtp(interaction, options.getString('otp'));
                break;
            case 'help':
                await interaction.reply({ embeds: [getHelpMessage()] });
                break;
            case 'list-verified':
                await handleListVerified(interaction);
                break;
            case 'remove-verification':
                await handleRemoveVerification(interaction, options.getUser('user'));
                break;
            case 'update-required-inscriptions':
                await handleUpdateRequiredInscriptions(interaction, options.getString('inscriptions'));
                break;
        }
    } catch (error) {
        logger.error(`Error handling command ${commandName}: ${error.message}`);
        await replyWithError(interaction, 'An error occurred while processing your command. Please try again later.');
    }
});

// Cooldown handling
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
            throw new Error(`Please wait ${timeLeft.toFixed(1)} more seconds before reusing the \`${commandName}\` command.`);
        }
    }

    timestamps.set(userId, now);
    setTimeout(() => timestamps.delete(userId), cooldownAmount);
};

// Handle verify command
const handleVerify = async (interaction, bitcoinAddress) => {
    await interaction.deferReply({ ephemeral: true });
    const otp = generateOTP();
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData?.inscriptions?.length) {
        await interaction.editReply('No inscriptions found in your wallet.');
        return;
    }
    if (!await verifyInscriptions(bitcoinAddress, REQUIRED_INSCRIPTIONS)) {
        await interaction.editReply('None of the required inscriptions were found in your wallet.');
        return;
    }
    await User.upsert({
        discordId: interaction.user.id,
        bitcoinAddress,
        inscriptionId: walletData.inscriptions[0].id,
        otp
    });
    await interaction.editReply(`To verify, please enter the following OTP using the /verify-otp command: \`${otp}\``);
};

// Handle verify-otp command
const handleVerifyOtp = async (interaction, otp) => {
    const user = await User.findByPk(interaction.user.id);
    if (!user) {
        await interaction.reply('Please initiate the verification process first using /verify command.');
        return;
    }
    if (user.otp !== otp) {
        await interaction.reply('Invalid OTP.');
        return;
    }
    if (!await verifyInscriptions(user.bitcoinAddress, REQUIRED_INSCRIPTIONS)) {
        await interaction.reply('You do not hold any of the required inscriptions.');
        await removeRole(interaction.guild, interaction.user.id);
        return;
    }
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    let role = guild.roles.cache.get(ROLE_ID) || await guild.roles.create({ name: 'Verified', color: 'BLUE' });
    await member.roles.add(role);
    await User.update({ otp: ''}, { where: { discordId: interaction.user.id } });
    await interaction.reply('Role assigned! You are now verified.');

    // Log to admin channel
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setTitle('User Verified')
            .setDescription(`<@${interaction.user.id}> has been verified and assigned the Verified role.`)
            .setColor('BLUE')
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
};

// Handle list-verified command
const handleListVerified = async (interaction) => {
    try {
        const verifiedUsers = await User.findAll({ attributes: ['discordId', 'bitcoinAddress'] });
        if (!verifiedUsers.length) {
            await interaction.reply('No verified users found.');
            return;
        }
        const userList = verifiedUsers.map(user => `<@${user.discordId}> - Bitcoin Address: ${user.bitcoinAddress}`).join('\n');
        await interaction.reply({ embeds: [new EmbedBuilder().setTitle('Verified Users').setDescription(userList).setColor('#0000FF')] });
    } catch (error) {
        logger.error(`Error listing verified users: ${error.message}`);
        await replyWithError(interaction, 'An error occurred while processing your command. Please try again later.');
    }
};

// Handle remove-verification command
const handleRemoveVerification = async (interaction, user) => {
    const guild = interaction.guild;
    const member = await guild.members.fetch(user.id);
    await removeRole(guild, user.id);
    await User.destroy({ where: { discordId: user.id } });
    await interaction.reply(`Verification removed for ${user.tag}.`);

    // Log to admin channel
    const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
        const embed = new EmbedBuilder()
            .setTitle('Verification Removed')
            .setDescription(`<@${user.id}> has had their verification removed.`)
            .setColor('RED')
            .setTimestamp();
        await logChannel.send({ embeds: [embed] });
    }
};

// Handle update-required-inscriptions command
const handleUpdateRequiredInscriptions = async (interaction, inscriptions) => {
    try {
        const inscriptionList = inscriptions.split(',').map(inscription => inscription.trim());
        const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
        config.REQUIRED_INSCRIPTIONS = inscriptionList;
        fs.writeFileSync('./config.json', JSON.stringify(config, null, 4));
        await interaction.reply('Required inscriptions have been updated successfully.');
    } catch (error) {
        logger.error(`Error updating required inscriptions: ${error.message}`);
        await replyWithError(interaction, 'An error occurred while processing your command. Please try again later.');
    }
};

// Remove role from a user
const removeRole = async (guild, userId) => {
    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(ROLE_ID);
    if (role) {
        await member.roles.remove(role);
    }
};

// Get help message
const getHelpMessage = () => {
    return new EmbedBuilder()
        .setTitle('Help')
        .setDescription(`
        **Available Commands:**
        - /verify: Verify your Bitcoin inscription.
        - /verify-otp: Verify the OTP sent to your wallet.
        - /list-verified: List all verified users.
        - /remove-verification: Remove a user's verification.
        - /update-required-inscriptions: Update the list of required inscriptions.
        `)
        .setColor('#00FF00');
};

// Reply with error message
const replyWithError = async (interaction, errorMessage) => {
    const errorMsg = errorMessage || 'An error occurred while processing your command. Please try again later.';
    if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: errorMessage, ephemeral: true });
    } else if (interaction.deferred) {
        await interaction.editReply(errorMessage);
    }
};

client.login(BOT_TOKEN);
