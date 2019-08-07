export default interface Logger {

    setLoggingLevel(logLevel: string): void

    emerg(...message: any): void

    alert(...message: any): void

    crit(...message: any): void

    error(...message: any): void

    warning(...message: any): void

    notice(...message: any): void

    info(...message: any): void

    debug(...message: any): void
}
