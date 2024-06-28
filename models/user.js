const { Sequelize, DataTypes } = require("sequelize");

class Database {
  constructor() {
    this.sequelize = new Sequelize({
      dialect: "sqlite",
      storage: "database.sqlite",
    });
    this.models = this.defineModels();
  }

  defineModels() {
    const User = this.sequelize.define("User", {
      discordId: {
        type: DataTypes.STRING,
        primaryKey: true,
      },
      bitcoinAddress: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      inscriptionId: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    });

    return { User };
  }

  async synchronize() {
    try {
      await this.sequelize.authenticate();
      console.log("Connection to the database has been established successfully.");
      await this.sequelize.sync();
      console.log("Database synchronized.");
    } catch (error) {
      console.error("Unable to connect to the database:", error);
    }
  }
}

const db = new Database();
db.synchronize();

module.exports = db.models;
