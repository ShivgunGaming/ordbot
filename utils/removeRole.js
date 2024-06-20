const winston = require("winston");
const { ROLE_ID } = require("../config.json");

// Fetch member by user ID
const fetchMember = async (guild, userId) => {
  try {
    return await guild.members.fetch(userId);
  } catch (error) {
    winston.error(`Error fetching member: ${error.message}`);
    throw error;
  }
};

// Fetch role by role ID
const fetchRole = (guild) => {
  const role = guild.roles.cache.get(ROLE_ID);
  if (!role) {
    const error = new Error(`Role with ID ${ROLE_ID} not found`);
    winston.error(error.message);
    throw error;
  }
  return role;
};

// Remove a role from a user
const removeRole = async (guild, userId) => {
  try {
    const member = await fetchMember(guild, userId);
    const role = fetchRole(guild);
    await member.roles.remove(role);
    winston.info(`Role removed from user ${userId}`);
  } catch (error) {
    winston.error(`Error removing role: ${error.message}`);
  }
};

module.exports = { removeRole };
