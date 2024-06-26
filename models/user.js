const { Sequelize, DataTypes } = require("sequelize");

const initializeSequelize = () => {
  return new Sequelize({
    dialect: "sqlite",
    storage: "database.sqlite",
  });
};

const defineUserModel = (sequelize) => {
  return sequelize.define("User", {
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
};

const synchronizeDatabase = async (sequelize) => {
  try {
    await sequelize.authenticate();
    console.log("Connection to the database has been established successfully.");
    await sequelize.sync();
    console.log("Database synchronized.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

const sequelize = initializeSequelize();
const User = defineUserModel(sequelize);

(async () => {
  await synchronizeDatabase(sequelize);
})();

module.exports = { User, sequelize };
