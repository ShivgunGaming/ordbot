# Ordbot 🤖

This Discord bot facilitates the verification process using Bitcoin inscriptions and OTP (One-Time Password) for user authentication. It interacts with a wallet API to fetch Bitcoin inscription data and provides role assignment upon successful verification.

## Features ✨
- **Verification Process**: Users can verify their Bitcoin inscription using the `/verify` command and receive an OTP.
- **OTP Verification**: Users can verify their OTP using the `/verify-otp` command.
- **Role Assignment**: Upon successful verification, users receive a designated role.
- **Command Customization**: Bot commands can be customized and extended as needed.
- **Embed Setup**: Admins can set up an embed for verification using the `/setup-embed` command.
- **Configuration Management**: Admins can configure bot settings using the `/set-config` command.

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
- `/create-collection`: Create a new collection with an associated role.
- `/setup-embed`: Set up an embed for verification (Admin only).
- `/set-config`: Set bot configuration settings (Admin only).
- `/help`: Get help with bot commands.
