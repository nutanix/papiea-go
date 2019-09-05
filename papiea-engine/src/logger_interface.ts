export default interface Logger {

    setLoggingLevel(logLevel: string): void

    emerg(msg: any, ...messages: any[]): void

    alert(msg: any, ...messages: any[]): void

    crit(msg: any, ...messages: any[]): void

    error(msg: any, ...messages: any[]): void

    warning(msg: any, ...messages: any[]): void

    notice(msg: any, ...messages: any[]): void

    info(msg: any, ...messages: any[]): void

    debug(msg: any, ...messages: any[]): void
}
