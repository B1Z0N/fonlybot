import * as http from 'http'
import * as url from 'url'
import { promises as fs } from 'fs'
import Fastify from 'fastify'
import { log } from '@/helpers/log'

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
    const pp = `${await fs.readFile(`${TEMPLATE_FOLDER}/privacy_policy.html`)}`

    const app = Fastify({})

    app.get('/', (request, reply) => {
        reply.type('text/html').code(200).send(index)
    })

    app.get('/pp', (request, reply) => {
        reply.type('text/html').code(200).send(pp)
    })

    app.route({
        method: 'GET',
        url: '/',
        schema: {
            querystring: {
                code: { type: 'string' },
                state: { type: 'string' },
            },
        },
        handler: async (request, reply) => {
            const { code, state } = request.query as any
            const { cid, onetimepass, lang } = JSON.parse(`${state}`)
            const httpCode = await cb(cid, onetimepass, `${code}`)

            reply.code(httpCode)

            if (httpCode >= 200 && httpCode <= 299) {
                reply.send(
                    template({
                        message: i18n.t(lang, 'google_success_site'),
                    })
                )
            } else if (httpCode >= 400 && httpCode <= 599) {
                reply.send(
                    template({
                        error: `${i18n.t(lang, 'error_site')} ${httpCode}`,
                        message: i18n.t(lang, 'google_failure_site'),
                    })
                )
            }
        },
    })

    app.listen(PORT, (err, address) => {
        if (err) {
            log.error(`[server] ${err}`)
        }
    })
}
