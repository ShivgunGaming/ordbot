const { Sequelize, DataTypes } = require("sequelize");

// Initialize Sequelize with SQLite dialect and specify database file
const sequelize = new Sequelize({
  dialect: "sqlite",
  storage: "database.sqlite"
});

// Define User model
const User = sequelize.define("User", {
  discordId: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  bitcoinAddress: {
    type: DataTypes.STRING,
    allowNull: false
  },
  inscriptionId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false
  },
});

// Synchronize the model with the database
(async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection to the database has been established successfully.");
    await sequelize.sync(); // This synchronizes all defined models with the database
    console.log("Database synchronized.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
})();

module.exports = { User, sequelize };
