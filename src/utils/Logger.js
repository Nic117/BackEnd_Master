import __dirname from "../utils/utils.js";
import winston from "winston";
import path from "path";
import { config } from "dotenv";

let customLevels = {
    fatal: 0,
    error: 1,
    warning: 2,
    info: 3,
    http: 4,
    debug: 5
}

const customColors = {
    fatal: "bold inverse red",
    error: "bold red",
    warning: "bold yellow",
    info: "green",
    http: "cyan",
    debug: "bold inverse grey"
}

winston.addColors(customColors);

export const loggerProd = winston.createLogger(
    {
        levels: customLevels,
        transports: [
            new winston.transports.Console(
                {
                    level: "info",
                    format: winston.format.combine(
                        winston.format.colorize({ colors: customColors }),
                        winston.format.timestamp(),
                        winston.format.simple()
                    )
                }
            ),
            new winston.transports.File(
                {
                    filename: path.join(__dirname, '/errors.log'),
                    level: "error",
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.json()
                    )
                }
            )
        ]
    }
)

export const loggerDev = winston.createLogger(
    {
        levels: customLevels,
        transports: [
            new winston.transports.Console(
                {
                    level: "debug",
                    format: winston.format.combine(
                        winston.format.colorize({ colors: customColors }),
                        winston.format.timestamp(),
                        winston.format.simple(),
                        winston.format.errors({ stack: true })
                    )
                }
            )
        ]
    }
)

export const logger = winston.createLogger(
    {
        levels: customLevels,
        transports: [loggerProd]
    }
)

const enviroment = config.MODE

if (enviroment == "dev") {
    logger.add(loggerDev)
}

export const middLogger = (req, res, next) => {
    req.logger = logger
    next()
}