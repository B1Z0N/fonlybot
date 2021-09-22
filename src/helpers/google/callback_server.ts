import * as http from 'http'
import * as url from 'url'
import { EventEmitter } from 'events'

const _del_idx = process.env.OAUTH_CB_SERVER.lastIndexOf(':')
export const HOST = process.env.OAUTH_CB_SERVER.substring(0, _del_idx)
export const PORT = +process.env.OAUTH_CB_SERVER.substring(_del_idx + 1)

export const OAuthEmitter = new EventEmitter()

http.createServer(async (req, res) => {
    const { query } = url.parse(req.url, true);
    if (!query.code || !query.state) return

    OAuthEmitter.emit('signin', +`${query.state}`, `${query.code}`)

    res.writeHead(200)
    res.end(`You\'re all setup! You may now close this window.`)
}).listen(PORT)
