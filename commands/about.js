// commands/about.js
const { EmbedBuilder } = require('discord.js');

const aboutCommand = {
  name: 'about',
  description: 'Provides information about the bot',
  execute: async (interaction) => {
    const embed = new EmbedBuilder()
      .setTitle('About This Bot')
      .setDescription('This bot verifies Bitcoin inscriptions and assigns roles based on ownership.')
      .setColor('#00FF00')
      .addFields(
        { name: 'Version', value: '1.0.0', inline: true },
        { name: 'Author', value: 'Your Name', inline: true },
        { name: 'Repository', value: '[GitHub](https://github.com/your-repo)', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};

module.exports = aboutCommand;
