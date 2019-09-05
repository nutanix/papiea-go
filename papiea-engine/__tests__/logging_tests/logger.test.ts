import Logger from "../../src/logger_interface"
import { WinstonLogger } from "../../src/logger"
import { readFileSync, watch } from "fs"
import { resolve } from "path"

describe("Logger tests", () => {
    test("Logger can work with a list of parameters", () => {
        const logger: Logger = new WinstonLogger("info", "logger_test.log")
        logger.error({ one: "error" }, { two: "errors" }, { three: "errors" })
        // First change is creating file, second one is writing to the file
        let change_count = 1
        const watcher = watch(resolve(__dirname, "../../src/logs"), (event, filename) => {
            if (filename === "logger_test.log" && change_count === 2) {
                const content: string = readFileSync(resolve(__dirname, "../../src/logs/logger_test.log"), "utf-8")
                expect(content).toEqual('{"0":{"two":"errors"},"1":{"three":"errors"},"2":{"Time":"2019-08-21T14:26:41.129Z"},"level":"error","message":{"one":"error"}}\n')
            }
            change_count++
        })
        watcher.close()
    })
})