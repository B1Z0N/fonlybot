import * as http from 'http'
import * as url from 'url'
import { promises as fs } from 'fs'

import { i18n } from '@/helpers/i18n'
import * as Mustache from 'mustache'

export const TEMPLATE_FOLDER = `${process.cwd()}/templates`
export const PORT = +process.env.CB_PORT

export interface OAuthCallback {
	(cid: number, onetimepass: string, code: string): Promise<number>
}

export async function OAuthSubscribe(cb: OAuthCallback) {

const templateHTML = `${await fs.readFile(`${TEMPLATE_FOLDER}/template.html`)}`
const template = (view) => Mustache.render(templateHTML, view)

http.createServer(async (req, res) => {
    const { query } = url.parse(req.url, true);

    if (!query || !query.code || !query.state) {
	    res.end()
	    return
    }

    const { cid, onetimepass, lang } = JSON.parse(`${query.state}`)
    const httpCode = await cb(cid, onetimepass,`${query.code}`)
    res.writeHead(httpCode)

    if (httpCode >= 200 && httpCode <= 299) {
	res.end(template({ 
		message: i18n.t(lang, 'google_success'),
		window_close: i18n.t(lang, 'site_may_close')
	}))
    } else if (httpCode >= 400 && httpCode <= 599) {
	res.end(template({ 
		error_code: httpCode, error: i18n.t(lang, 'site_error'), message: i18n.t(lang, 'google_failure'),
		window_close: i18n.t(lang, 'site_may_close')
	}))
    }
}).listen(PORT)
}
