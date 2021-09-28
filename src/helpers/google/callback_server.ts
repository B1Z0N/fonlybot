import * as http from 'http'
import * as url from 'url'
import { promises as fs } from 'fs'

import { i18n } from '@/helpers/i18n'
import * as Mustache from 'mustache'

export const TEMPLATE_FOLDER = `${process.cwd()}/static/templates`
export const PORT = +process.env.CB_PORT

export interface OAuthCallback {
    (cid: number, onetimepass: string, code: string): Promise<number>
}

export async function OAuthSubscribe(cb: OAuthCallback) {
    const templateHTML = `${await fs.readFile(
        `${TEMPLATE_FOLDER}/result.html`
    )}`
    const template = (view) => Mustache.render(templateHTML, view)
    const index = `${await fs.readFile(`${TEMPLATE_FOLDER}/index.html`)}`
    http.createServer(async (req, res) => {
        const { query, path } = url.parse(req.url, true)

	if (path == '/')
	{
	    res.writeHead(200)
	    res.end(index)
	    return
	}

        if (!query || !query.code || !query.state) {
            res.end()
            return
        }

        const { cid, onetimepass, lang } = JSON.parse(`${query.state}`)
        const httpCode = await cb(cid, onetimepass, `${query.code}`)
        res.writeHead(httpCode)

        if (httpCode >= 200 && httpCode <= 299) {
            res.end(
                template({
                    message: i18n.t(lang, 'google_success_site'),
                })
            )
        } else if (httpCode >= 400 && httpCode <= 599) {
            res.end(
                template({
                    error: `${i18n.t(lang, 'error_site')} ${httpCode}`,
                    message: i18n.t(lang, 'google_failure_site'),
                })
            )
        }
    }).listen(PORT)
}
