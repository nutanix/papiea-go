import * as winston from 'winston';
import { resolve } from "path";
import { NextFunction, Request, Response } from "express";


let logger: winston.Logger;

export async function createDefaultLogger(logLevel: string): Promise<void> {
    if (!logger) {
        logger = await createLogger(logLevel);
    } else {
        logger.warn("Logger already created");
        throw new Error("Logger already created");
    }
}

export async function createLogger(logLevel: string): Promise<winston.Logger> {
    return winston.createLogger({
        level: logLevel,
        exitOnError: false,
        format: winston.format.json(),
        transports: [
            new winston.transports.File({ filename: resolve(__dirname, `./logs/papiea_${logLevel}.log`) }),
            new winston.transports.Console()
        ],
    });
}


export async function loggingMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    res.on("finish", () => {
        const logmsg: { [key: string]: any }  = {
            'Request IP': req.ip,
            'Method': req.method,
            'URL': req.originalUrl,
            'Headers': req.headers,
            'Status code': res.statusCode,
            'Time': new Date(),
        };
        if (req.method !== "GET") {
            logmsg["Request body"] = req.body;
        }
        logger.info(logmsg);
    });
    next();
}

export function getDefaultLogger(): winston.Logger {
    if (!logger) {
        throw new Error("Logger has not been created. Please, use createDefaultLogger");
    }  
    return logger;
}