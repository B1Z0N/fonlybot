import * as http from 'http'
import * as url from 'url'
import { EventEmitter } from 'events'

export const HOST =  process.env.OAUTH_CB_HOST
export const PORT = +process.env.OAUTH_CB_PORT

export const OAuthEmitter = new EventEmitter()

http.createServer(async (req, res) => {
    const { query } = url.parse(req.url, true);
    if (!query.code || !query.state) return

    OAuthEmitter.emit('signin', +`${query.state}`, `${query.code}`)

    res.writeHead(200)
    res.end(`You\'re all setup! You may now close this window.`)
}).listen(PORT)
