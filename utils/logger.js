import chalk from "chalk";

const logger = {
  info: (message) => {
    const formattedTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} ${chalk.blue.bold("INFO:")} ${message}`);
  },
  success: (message) => {
    const formattedTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} ${chalk.green.bold("SUCCESS:")} ${message}`);
  },
  warning: (message) => {
    const formattedTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} ${chalk.yellow.bold("WARNING:")} ${message}`);
  },
  error: (message) => {
    const formattedTime = new Date().toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
    console.log(`${formattedTime} ${chalk.red.bold("ERROR:")} ${message}`);
  },
};

export { logger };
