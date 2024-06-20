const { createLogger, format, transports } = require("winston");

// Function to set up the logger
const setupLogger = () => {
  const logger = createLogger({
    level: "info",
    format: format.combine(
      format.timestamp(),
      format.printf(({ timestamp, level, message }) => `${timestamp} [${level}]: ${message}`)
    ),
    transports: [
      new transports.Console(),
      new transports.File({ filename: "bot.log" })
    ],
  });

  return logger;
};

module.exports = { setupLogger };
