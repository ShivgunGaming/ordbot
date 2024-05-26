const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { BOT_TOKEN, CLIENT_ID, GUILD_ID, ROLE_ID, ORDINALS_API_URL } = require('./config.json');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

client.once('ready', () => {
    console.log('Bot is online!');
});

const fetchWalletData = async (bitcoinAddress) => {
    const url = `${ORDINALS_API_URL}/wallet/${bitcoinAddress}`;
    try {
        const response = await axios.get(url);
        console.log('Raw API Response:', JSON.stringify(response.data, null, 2)); // Log the raw API response
        return response.data;
    } catch (error) {
        console.error('Error fetching wallet data:', error);
        return null;
    }
};

const verifyInscription = async (bitcoinAddress, inscriptionToCheck) => {
    const walletData = await fetchWalletData(bitcoinAddress);
    if (!walletData) {
        throw new Error('Could not fetch wallet data.');
    }

    const inscriptions = walletData.inscriptions || [];
    for (const inscription of inscriptions) {
        if (inscription.id === inscriptionToCheck) {
            console.log('Inscription found:', inscription.id);
            return true;
        }
    }

    console.log('Inscription not found.');
    return false;
};

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'verify') {
        const bitcoinAddress = options.getString('address');
        const inscriptionToCheck = options.getString('inscription');

        console.log(`Verifying inscription: ${inscriptionToCheck} for address: ${bitcoinAddress}`);

        try {
            await interaction.deferReply({ ephemeral: true });

            const hasInscription = await verifyInscription(bitcoinAddress, inscriptionToCheck);

            if (hasInscription) {
                const guild = interaction.guild;
                const member = await guild.members.fetch(interaction.user.id);
                const role = guild.roles.cache.get(ROLE_ID);

                if (role) {
                    await member.roles.add(role);
                    console.log('Role added successfully.');
                    await interaction.editReply(`Role assigned! You are holding the inscription: ${inscriptionToCheck}`);
                } else {
                    console.error('Role not found.');
                    await interaction.editReply('Role not found.');
                }
            } else {
                console.log('Inscription not found in wallet.');
                await interaction.editReply('You do not hold the required inscription.');
            }
        } catch (error) {
            console.error('Error:', error);
            await interaction.editReply('An error occurred while verifying your inscription.');
        }
    }
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const { commandName, options } = interaction;

    if (commandName === 'create-collection') {
        const collectionName = options.getString('name');
        const roleName = options.getString('role');

        // Implement logic to create a collection
        await interaction.reply(`Collection ${collectionName} created with role ${roleName}.`);
    }

    if (commandName === 'setup-embed') {
        const description = options.getString('description');
        const embed = new EmbedBuilder()
            .setTitle('Verify Ownership')
            .setDescription(description);

        await interaction.channel.send({ embeds: [embed] });
        await interaction.reply('Embed setup for verification.');
    }
});

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
        console.error('Error reloading commands:', error);
    }
})();

client.login(BOT_TOKEN);
