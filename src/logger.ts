import winston, { Logger } from 'winston';

const customLevels = {
    levels: {
        error: 0,
        warn: 1,
        info: 2,
        trace: 3,
    },
    colors: {
        error: 'red',
        warn: 'yellow',
        info: 'green',
        trace: 'blue',
    },
};

winston.addColors(customLevels.colors);

const logFormat = winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level}: ${message}`;
    })
);

const fileFormat = winston.format.combine(
    winston.format.uncolorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
        return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    })
);

const baseLogger = winston.createLogger({
    levels: customLevels.levels,
    level: process.env.LOG_LEVEL?.toLowerCase() === 'trace' ? 'trace' : 'info',
    format: logFormat,
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({
            filename: 'logs/app.log',
            format: fileFormat,
        }),
    ],
});


interface LoggerWithTrace extends Logger {
    trace: (message: string) => Logger;
}

const logger: LoggerWithTrace = baseLogger as LoggerWithTrace;
logger.trace = (message: string) => logger.log('trace', message);

export default logger;
