const winston = require("winston");
const { ROLE_ID } = require("../config.json");

// Remove a role from a user
const removeRole = async (guild, userId) => {
  try {
    const member = await guild.members.fetch(userId);
    const role = guild.roles.cache.get(ROLE_ID);
    if (role) await member.roles.remove(role);
  } catch (error) {
    winston.error(`Error removing role: ${error.message}`);
  }
};

module.exports = { removeRole };
