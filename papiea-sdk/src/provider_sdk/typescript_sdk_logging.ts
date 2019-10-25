import * as winston from 'winston'
import { LoggerFactory } from "./typescript_sdk_interface"
import { Format } from 'logform';

export function makeLoggerFactory(procedureName: string): LoggerFactory {
    return new WinstonLoggerFactory(procedureName)
}

export class WinstonLoggerFactory implements LoggerFactory {
    public procedureName: string

    constructor(procedureName: string) {
        this.procedureName = procedureName
    }

    createLogger(logLevel: string = "info", prettyPrint?: boolean): winston.Logger {
        let formatArgs: Format[] = [winston.format.json(), winston.format.timestamp()]
        if (prettyPrint) {
            formatArgs.push(winston.format.prettyPrint())
        }
        let label: Format
        // Check if the module is used in import, then log the importer filename
        if (require.main) {
            label = winston.format.label({ label: `${ require.main.filename } - ${ this.procedureName }`})
        } else {
            label = winston.format.label({ label: `${ this.procedureName }`})
        }
        formatArgs.push(label)
        const winstonFormat = winston.format.combine(...formatArgs)
        const logger = winston.createLogger({
            levels: winston.config.syslog.levels,
            level: logLevel || "info",
            exitOnError: false,
            format: winstonFormat,
            transports: [
                new winston.transports.Console({
                    format: winstonFormat
                }),
            ],
            exceptionHandlers: [
                new winston.transports.Console({
                    format: winstonFormat,
                    level: "error"
                }),
            ]
        })
        return logger
    }
}