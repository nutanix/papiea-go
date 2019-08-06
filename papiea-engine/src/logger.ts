import * as winston from 'winston';
import { resolve } from "path";
import { NextFunction, Request } from "express";

export function getLoggingMiddleware(logger: Logger) {
    return async (req: Request, res: any, next: NextFunction): Promise<void> => {
        let end = res.end;
        (<any>res).end = (chunk: any, encoding?: string) => {
            res.end = end;
            res.end(chunk, encoding);
            if (chunk) {
                const stringChunk = chunk && chunk.toString();
                res.body = (safeJSONParse(chunk) || stringChunk);
            }
        };
        res.on("finish", () => {
            const logmsg: { [key: string]: any }  = {
                'Request IP': req.ip,
                'Method': req.method,
                'URL': req.originalUrl,
                'Headers': req.headers,
                'Status code': res.statusCode,
                'Response body': res.body,
                'Time': new Date(),
            };
            if (req.method !== "GET") {
                logmsg["Request body"] = req.body;
            }
            logger.info(logmsg);
        });
        next();
    }
}

function safeJSONParse(chunk: string) {
    try {
        return JSON.parse(chunk);
    } catch (e) {
        return undefined;
    }
}

export class Logger {
    private logger: winston.Logger;
    private readonly logLevels = ["emerg", "alert", "crit", "error", "warning", "notice", "info", "debug"];

    constructor(logLevel: string, logFile?: string) {
        if (!this.isValidLevel(logLevel)) {
            throw new Error("Unsupported logging level");
        }
        this.logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: logLevel,
            exitOnError: false,
            format: winston.format.json(),
            transports: [
                new winston.transports.File({ filename: logFile ?
                    resolve(__dirname, `./logs/${logFile}`) :
                    resolve(__dirname, `./logs/papiea_${logLevel}.log`) }),
                new winston.transports.Console()
            ],
        });
    }

    private isValidLevel(logLevel: string) {
        return this.logLevels.includes(logLevel)
    }

    public setLoggingLevel(logLevel: string) {
        if (!this.isValidLevel(logLevel)) {
            throw new Error("Unsupported logging level");
        }
        this.logger.level = logLevel;
    }

    public emerg(...message: any): void {
        message["Time"] = new Date();
        this.logger.emerg(message);
    }

    public alert(...message: any): void {
        message["Time"] = new Date();
        this.logger.alert(message);
    }

    public crit(...message: any): void {
        message["Time"] = new Date();
        this.logger.crit(message);
    }

    public error(...message: any): void {
        message["Time"] = new Date();
        this.logger.error(message);
    }

    public warning(...message: any): void {
        message["Time"] = new Date();
        this.logger.warning(message);
    }

    public notice(...message: any): void {
        message["Time"] = new Date();
        this.logger.notice(message);
    }

    public info(...message: any): void {
        message["Time"] = new Date();
        this.logger.info(message);
    }

    public debug(...message: any): void {
        message["Time"] = new Date();
        this.logger.debug(message);
    }
}
