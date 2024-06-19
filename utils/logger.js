const winston = require("winston");

const setupLogger = () => {
  return winston.createLogger({
    level: "info",
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [new winston.transports.Console(), new winston.transports.File({ filename: "bot.log" })],
  });
};

module.exports = { setupLogger };
