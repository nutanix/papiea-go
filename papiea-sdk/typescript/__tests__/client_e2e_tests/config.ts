import https = require('https')
import { readFileSync } from 'fs'
import { resolve } from 'path'

module.exports = {
    oauth2_server_host: "localhost",
    oauth2_server_port: 9002,
    papiea_url: "https://localhost:3000",
    admin_s2s_key: "",
    server_host: "localhost",
    server_port: 9000,
    papiea_server_port: 3000,
    bucket: "bucket",
    object: "object",
    httpsAgent: new https.Agent({
        ca: readFileSync(resolve(__dirname, '../../certs/ca.crt'), 'utf8')
    })
}