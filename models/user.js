const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize({ dialect: "sqlite", storage: "database.sqlite" });

const User = sequelize.define("User", {
  discordId: { type: DataTypes.STRING, primaryKey: true },
  bitcoinAddress: { type: DataTypes.STRING, allowNull: false },
  inscriptionId: { type: DataTypes.STRING, allowNull: false },
  otp: { type: DataTypes.STRING, allowNull: false },
});

sequelize.sync().catch(console.error); // Synchronize the model with the database

module.exports = { User, sequelize };
