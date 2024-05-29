const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const { Sequelize, DataTypes } = require('sequelize');
const { BOT_TOKEN, CLIENT_ID, GUILD_ID, ROLE_ID, ORDINALS_API_URL } = require('./config.json');

// Initialize Discord client
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Initialize database
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite',
});
const User = sequelize.define('User', {
    discordId: { type: DataTypes.STRING, primaryKey: true },
    bitcoinAddress: { type: DataTypes.STRING, allowNull: false },
    inscriptionId: { type: DataTypes.STRING, allowNull: false },
});
sequelize.sync();

// Fetch wallet data from the API
const fetchWalletData = async (bitcoinAddress) => {
    const url = `${ORDINALS_API_URL}/wallet/${bitcoinAddress}`;
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error('Error fetching wallet data:', error.message);
        return null;
    }
};

// Verify if the inscription exists in the wallet data
const verifyInscription = async (bitcoinAddress, inscriptionToCheck) => {
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData) {
        throw new Error('Could not fetch wallet data.');
    }
    const inscriptions = walletData.inscriptions || [];
    return inscriptions.some(inscription => inscription.id === inscriptionToCheck);
};

// Set configuration value
const setConfig = async (key, value) => {
    const config = JSON.parse(fs.readFileSync('./config.json', 'utf8'));
    config[key] = value;
    fs.writeFileSync('./config.json', JSON.stringify(config, null, 2));
};

// Load and register commands
const commands = [
    {
        name: 'verify',
        description: 'Verify your Bitcoin inscription',
        options: [
            {
                name: 'address',
                type: ApplicationCommandOptionType.String,
                description: 'Your Bitcoin address',
                required: true,
            },
            {
                name: 'inscription',
                type: ApplicationCommandOptionType.String,
                description: 'The inscription to check for',
                required: true,
            },
        ],
    },
    {
        name: 'create-collection',
        description: 'Create a new collection',
        options: [
            {
                name: 'name',
                type: ApplicationCommandOptionType.String,
                description: 'Name of the collection',
                required: true,
            },
            {
                name: 'role',
                type: ApplicationCommandOptionType.String,
                description: 'Role associated with the collection',
                required: true,
            },
        ],
    },
    {
        name: 'setup-embed',
        description: 'Setup an embed for verification',
        options: [
            {
                name: 'description',
                type: ApplicationCommandOptionType.String,
                description: 'Description of the embed',
                required: true,
            },
        ],
    },
    {
        name: 'set-config',
        description: 'Set a bot configuration',
        options: [
            {
                name: 'key',
                type: ApplicationCommandOptionType.String,
                description: 'Configuration key',
                required: true,
            },
            {
                name: 'value',
                type: ApplicationCommandOptionType.String,
                description: 'Configuration value',
                required: true,
            },
        ],
    },
];

const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

(async () => {
    try {
        await rest.put(
            Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
            { body: commands },
        );
        console.log('Successfully registered application commands.');
    } catch (error) {
        console.error('Error reloading commands:', error.message);
    }
})();

client.once('ready', () => {
    console.log('Bot is online!');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    try {
        if (commandName === 'verify') {
            const bitcoinAddress = options.getString('address');
            const inscriptionToCheck = options.getString('inscription');

            await interaction.deferReply({ ephemeral: true });
            const hasInscription = await verifyInscription(bitcoinAddress, inscriptionToCheck);

            if (hasInscription) {
                const guild = interaction.guild;
                const member = await guild.members.fetch(interaction.user.id);
                let role = guild.roles.cache.get(ROLE_ID);

                if (!role) {
                    role = await guild.roles.create({ name: 'Verified', color: 'BLUE' });
                }

                await member.roles.add(role);
                await User.upsert({ discordId: interaction.user.id, bitcoinAddress, inscriptionId: inscriptionToCheck });
                await interaction.editReply(`Role assigned! You are holding the inscription: ${inscriptionToCheck}`);
            } else {
                await interaction.editReply('You do not hold the required inscription.');
            }
        } else if (commandName === 'create-collection') {
            const collectionName = options.getString('name');
            const roleName = options.getString('role');
            await interaction.reply(`Collection ${collectionName} created with role ${roleName}.`);
        } else if (commandName === 'setup-embed') {
            const description = options.getString('description');
            const embed = new EmbedBuilder().setTitle('Verify Ownership').setDescription(description);
            await interaction.channel.send({ embeds: [embed] });
            await interaction.reply('Embed setup for verification.');
        } else if (commandName === 'set-config') {
            const key = options.getString('key');
            const value = options.getString('value');
            await setConfig(key, value);
            await interaction.reply(`Configuration updated: ${key} = ${value}`);
        }
    } catch (error) {
        console.error('Error handling command:', error.message);
        await interaction.reply('An error occurred while processing your command.');
    }
});

client.login(BOT_TOKEN);
