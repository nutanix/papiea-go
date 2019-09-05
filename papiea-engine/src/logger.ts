import * as winston from 'winston'
import { resolve } from "path"
import { NextFunction, Request } from "express"
import Logger from './logger_interface'
import { safeJSONParse } from "./utils/utils"

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

export class WinstonLogger implements Logger {
    private logger: winston.Logger;
    private readonly logLevels = ["emerg", "alert", "crit", "error", "warning", "notice", "info", "debug"];

    constructor(logLevel: string, logFile?: string) {
        if (!this.isValidLevel(logLevel)) {
            this.error(`Unsupported logging level: ${logLevel}`)
            // convert message to "warning", for lack of better knowledge
            logLevel = "warning"
        }
        let winstonFormat = winston.format.combine(winston.format.json(), winston.format.prettyPrint());
        this.logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: logLevel,
            exitOnError: false,
            format: winstonFormat,
            transports: [
                new winston.transports.File({
                    filename: logFile ?
                        resolve(__dirname, `./logs/${ logFile }`) :
                        resolve(__dirname, `./logs/papiea_${ logLevel }.log`),
                    format: winstonFormat
                }),
                new winston.transports.Console({
                    format: winstonFormat
                })
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

    public emerg(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.emerg(msg, messages);
    }

    public alert(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.alert(msg, messages);
    }

    public crit(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.crit(msg, messages);
    }

    public error(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.error(msg, messages);
    }

    public warning(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.warning(msg, messages);
    }

    public notice(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.notice(msg, messages);
    }

    public info(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.info(msg, messages);
    }

    public debug(msg: any, ...messages: any[]): void {
        messages.push({ Time: new Date() })
        this.logger.debug(msg, messages);
    }
}
