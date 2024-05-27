# Ordbot 💼

This bot verifies Bitcoin inscriptions and assigns roles to users based on their holdings. It utilizes the Discord.js library and interacts with the Ordinals API to fetch wallet data.

## Features 🚀

- Verify Bitcoin inscriptions and assign roles to users
- Create new collections
- Setup embeds for verification instructions

## Prerequisites 🛠️

- Node.js installed
- Discord bot token
- Access to a Bitcoin wallet with inscriptions
- Configuration file (`config.json`) with necessary keys and IDs

## Installation ⬇️

1. Clone the repository:

    ```
    git clone https://github.com/ShivgunGaming/ordbot.git
    cd ordbot
    ```

2. Install dependencies:

    ```
    npm install
    ```

3. Create a `config.json` file in the root directory with the following structure:

    ```json
    {
        "BOT_TOKEN": "your-bot-token",
        "CLIENT_ID": "your-client-id",
        "GUILD_ID": "your-guild-id",
        "ROLE_ID": "your-role-id",
        "ORDINALS_API_URL": "https://turbo.ordinalswallet.com"
    }
    ```

## Usage ℹ️

1. Start the bot:

    ```
    node index.js
    ```

2. Add the following slash commands to your Discord server:

    - **Verify Bitcoin Inscription:**

        ```
        /verify
        ```

        - `address`: Your Bitcoin address
        - `inscription`: The inscription to check for

    - **Create a Collection:**

        ```
        /create-collection
        ```

        - `name`: Name of the collection
        - `role`: Role associated with the collection

    - **Setup Embed for Verification:**

        ```
        /setup-embed
        ```

        - `description`: Description of the embed

## Commands 🤖

- `/verify`:
  Verifies if the user holds the specified Bitcoin inscription and assigns a role if they do.

- `/create-collection`:
  Creates a new collection and assigns a role to it.

- `/setup-embed`:
  Sets up an embed in the channel for verification instructions.

## Code Overview 📝

1. **Initialization and Configuration**:

    ```javascript
    const { Client, GatewayIntentBits, REST, Routes, ApplicationCommandOptionType, EmbedBuilder } = require('discord.js');
    const axios = require('axios');
    const { BOT_TOKEN, CLIENT_ID, GUILD_ID, ROLE_ID, ORDINALS_API_URL } = require('./config.json');

    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

    client.once('ready', () => {
        console.log('Bot is online!');
    });
    ```

2. **Fetching Wallet Data**:

    ```javascript
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
    ```

3. **Verifying Inscriptions**:

    ```javascript
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
    ```

4. **Interaction Handling**:

    ```javascript
    client.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) return;

        const { commandName, options } = interaction;

        // Interaction handling code
    });
    ```

5. **Registering Commands**:

    ```javascript
    const commands = [
        // Command definitions
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
    ```

6. **Logging in the Bot**:

    ```javascript
    client.login(BOT_TOKEN);
    ```
