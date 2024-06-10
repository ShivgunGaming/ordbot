![ordbotv2](https://github.com/ShivgunGaming/ordbot/assets/102505925/5e5976ae-c0bf-46cc-8337-e6e700c63330)

This Discord bot facilitates the verification process using Bitcoin inscriptions and OTP (One-Time Password) for user authentication. It interacts with a wallet API to fetch Bitcoin inscription data and provides role assignment upon successful verification.

![ordbotdemo](https://github.com/ShivgunGaming/ordbot/assets/102505925/a523687f-c3ed-4ada-892b-d480963f1517)

## Features ✨
- `verify`: Verify a user's Bitcoin inscription.
- `help`: Get help with bot commands.
- `list-verified`: List all verified users.
- `remove-verification`: Remove a user's verification.

- ## Database
Ordbot uses SQLite as its database system. The database file is named `database.sqlite`.

## Dependencies 📦
- [discord.js](https://discord.js.org/) - Discord API wrapper for Node.js
- [axios](https://github.com/axios/axios) - Promise-based HTTP client
- [winston](https://github.com/winstonjs/winston) - Logger for Node.js
- [sequelize](https://sequelize.org/) - Promise-based ORM for Node.js
- [crypto](https://nodejs.org/api/crypto.html) - Crypto module for generating OTP

## Setup 🛠️
1. Clone the repository and install dependencies.
2. Configure the `config.json` file with your Discord bot token, client ID, guild ID, role ID, and your required inscriptions.
3. Run the bot using `node index.js`.

## Usage 🚀
- `/verify`: Initiate the verification process by providing your Bitcoin address.
- `/verify-otp`: Verify the OTP sent to your wallet during the verification process.
- `/help`: Get help with bot commands.

## Adding the Bot to Your Server 🌐
To add this bot to your Discord server, click [here](https://discord.com/oauth2/authorize?client_id=1241662241418248212&permissions=633318697598967&scope=bot).
