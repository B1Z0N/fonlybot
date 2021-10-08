import * as http from 'http'
import * as url from 'url'
import { promises as fs } from 'fs'
import Fastify from 'fastify'
import { log } from '@/helpers/log'
import { ChatType } from '@/middlewares/dbchat'
import { i18n } from '@/helpers/i18n'
import * as Mustache from 'mustache'
import * as path from 'path'

export const TEMPLATE_FOLDER = path.join(process.cwd(), 'static/templates')
export const PORT = +process.env.CB_PORT

export interface OAuthCallback {
  (
    cid: number,
    chat_type: ChatType,
    chat_title: string,
    onetimepass: string,
    code: string
  ): Promise<number>
}

interface ICallbackQuerystring {
  code: string
  state: string
}

export async function OAuthSubscribe(cb: OAuthCallback) {
  const templateHTML = `${await fs.readFile(`${TEMPLATE_FOLDER}/result.html`)}`
  const template = (view) => Mustache.render(templateHTML, view)
  const index = `${await fs.readFile(`${TEMPLATE_FOLDER}/index.html`)}`
  const pp = `${await fs.readFile(`${TEMPLATE_FOLDER}/privacy_policy.html`)}`

  const app = Fastify({})

  // landing
  app.get('/', (request, reply) => {
    reply.type('text/html').code(200).send(index)
  })

  // privacy policy
  app.get('/pp', (request, reply) => {
    reply.type('text/html').code(200).send(pp)
  })

  // OAuth callback handler
  app.get<{ Querystring: ICallbackQuerystring }>(
    '/cb',
    async (request, reply) => {
      const { code, state } = request.query
      const { cid, chat_type, chat_title, onetimepass, lang } = JSON.parse(
        `${state}`
      )
      const httpCode = await cb(
        cid,
        chat_type as ChatType,
        chat_title,
        onetimepass,
        `${code}`
      )

      reply.type('text/html').code(httpCode)

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
    }
  )

  app.listen(PORT, (err, address) => {
    if (err) {
      log.error(`[server] ${err}`)
    }
  })
}
