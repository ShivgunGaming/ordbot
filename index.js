const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const winston = require('winston');
const { Sequelize, DataTypes } = require('sequelize');
const { BOT_TOKEN, CLIENT_ID, GUILD_ID, ROLE_ID, ORDINALS_API_URL, REQUIRED_INSCRIPTIONS } = require('./config.json');
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
sequelize.sync({ force: true }).then(() => console.log('Database synced!'));

// Logger initialization
const logger = winston.createLogger({
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'bot.log' })
    ]
});

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

const verifyInscriptions = async (bitcoinAddress, requiredInscriptions) => {
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData) throw new Error('Could not fetch wallet data.');
    return walletData.inscriptions?.some(inscription => requiredInscriptions.includes(inscription.id));
};

const generateOTP = () => crypto.randomBytes(3).toString('hex');

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
    { name: 'help', description: 'Get help with bot commands' }
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

client.once('ready', () => {
    console.log('Bot is online!');
    logger.info('Bot started successfully!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const { commandName, options } = interaction;

    try {
        switch (commandName) {
            case 'verify':
                await handleVerify(interaction, options.getString('address'));
                break;
            case 'verify-otp':
                await handleVerifyOtp(interaction, options.getString('otp'));
                break;
            case 'help':
                await interaction.reply(getHelpMessage());
                break;
        }
    } catch (error) {
        logger.error(`Error handling command ${commandName}: ${error.message}`);
        await replyWithError(interaction);
    }
});

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
        return;
    }
    const guild = interaction.guild;
    const member = await guild.members.fetch(interaction.user.id);
    let role = guild.roles.cache.get(ROLE_ID) || await guild.roles.create({ name: 'Verified', color: 'BLUE' });
    await member.roles.add(role);
    await User.update({ otp: '' }, { where: { discordId: interaction.user.id } });
    await interaction.reply('Role assigned! You are now verified.');
};

const getHelpMessage = () => `
**Available Commands:**
- /verify: Verify your Bitcoin inscription.
- /verify-otp: Verify the OTP sent to your wallet.
`;

const replyWithError = async interaction => {
    if (!interaction.replied && !interaction.deferred) {
        await interaction.reply('An error occurred while processing your command. Please try again later.');
    } else if (interaction.deferred) {
        await interaction.editReply('An error occurred while processing your command. Please try again later.');
    }
};

client.login(BOT_TOKEN);
