import { IAuthorization } from '@/helpers/google/google'
import { OAuthSubscribe } from '@/helpers/google/server'
import { findChat } from '@/models'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import { log } from '@/helpers/log'
import { i18n } from '@/helpers/i18n'
import { randomBytes } from 'crypto'
import { adminOrPrivateComposer } from '@/helpers/composers'
import { findOrCreateGoogleData } from '@/models/Google'

export async function setupAuthHandlers(
  bot: Telegraf<MongoSessionContext>,
  auth: IAuthorization
) {
  await OAuthSubscribe(
    async (cid, chat_type, chat_title, onetimepass, code) => {
      const dbchat = await findChat(cid)
      if (
        !dbchat ||
        dbchat.onetimepass === undefined ||
        dbchat.onetimepass !== onetimepass
      )
        return 403
      dbchat.onetimepass = undefined

      try {
        const tokens = await auth.getToken(code)
        const email = await auth.getEmail(tokens)
        const folder = await auth.getFolder(tokens, { name: chat_title })
        const credentials = await findOrCreateGoogleData(
          email,
          folder.id,
          tokens
        )
        dbchat.email = credentials.email

        const msg = i18n
          .t(dbchat.language, 'google_success_' + chat_type)
          .replace('{email}', email)
        await bot.telegram.editMessageText(
          cid,
          dbchat.to_edit_id,
          undefined,
          msg
        )
      } catch (err) {
        await bot.telegram.editMessageText(
          cid,
          dbchat.to_edit_id,
          undefined,
          i18n.t(dbchat.language, 'google_failure')
        )
        log.error(`[c=${cid}] Error on getting google auth code: ${err}.`)
        return 500
      } finally {
        dbchat.to_edit_id = undefined
        await dbchat.save()
      }
      return 200
    }
  )

  bot.command(
    'google',
    adminOrPrivateComposer(async (ctx) => {
      if (ctx.dbchat.to_edit_id) {
        await ctx.deleteMessage(ctx.dbchat.to_edit_id)
      }

      const onetimepass = randomBytes(20).toString('hex')
      const state = {
        cid: ctx.message.chat.id,
        chat_type: ctx.chat_type,
        chat_title: 'title' in ctx.chat ? ctx.chat.title : '',
        onetimepass,
        lang: ctx.dbchat.language,
      }
      ctx.dbchat.onetimepass = onetimepass
      ctx.dbchat.to_edit_id = (
        await ctx.replyWithMarkdown(
          ctx
            .t('google_signin_md')
            .replace('{0}', auth.getAuthUrl(JSON.stringify(state)))
        )
      ).message_id

      await ctx.dbchat.save()
    })
  )

  bot.command(
    'signout',
    adminOrPrivateComposer(async (ctx) => {
      ctx.dbchat.email = undefined
      await ctx.dbchat.save()

      return ctx.replyWithMarkdown(ctx.t('google_signout'))
    })
  )
}
