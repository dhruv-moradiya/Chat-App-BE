import fs from "fs";
import path from "path";
import util from "util";
import chalk from "chalk";

class Logger {
  constructor() {
    this.levels = {
      error: { label: "ERROR", color: chalk.red },
      warn: { label: "WARN ", color: chalk.yellow },
      info: { label: "INFO ", color: chalk.blue },
      debug: { label: "DEBUG", color: chalk.cyan },
      success: { label: "SUCCESS", color: chalk.green },
    };

    // Prepare logs folder path
    this.logsDir = path.join(process.cwd(), "logs");
    this.logFile = path.join(this.logsDir, "log.txt");

    // Create logs directory if it doesn't exist
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
  }

  // Format timestamp like: 2025-05-17 14:22:59
  _getTimestamp() {
    return new Date().toISOString().replace("T", " ").split(".")[0];
  }

  // Core logging function
  _log(level, message, meta) {
    const { label, color } = this.levels[level] || this.levels.info;
    const timestamp = this._getTimestamp();

    // Format metadata if exists
    let metaString = "";
    if (meta) {
      if (meta instanceof Error) {
        metaString = `\n${meta.stack}`;
      } else if (typeof meta === "object") {
        metaString = `\n${util.inspect(meta, { colors: false, depth: 3 })}`;
      } else {
        metaString = `\n${meta}`;
      }
    }

    // Compose log output for console (with colors)
    const consoleOutput = `${chalk.gray(timestamp)} ${color(
      label
    )}: ${message}${metaString}`;

    // Compose plain text log output for file (no colors)
    const fileOutput = `${timestamp} ${label}: ${message}${metaString}\n`;

    // Print to console
    console.log(consoleOutput);

    // Append to file asynchronously
    fs.appendFile(this.logFile, fileOutput, (err) => {
      if (err) {
        console.error("Failed to write log to file:", err);
      }
    });
  }

  // Public methods for each level
  info(message, meta) {
    this._log("info", message, meta);
  }

  warn(message, meta) {
    this._log("warn", message, meta);
  }

  error(message, meta) {
    this._log("error", message, meta);
  }

  debug(message, meta) {
    this._log("debug", message, meta);
  }

  success(message, meta) {
    this._log("success", message, meta);
  }
}

export const logger = new Logger();
