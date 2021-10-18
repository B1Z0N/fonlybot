import { IAuthorization } from '@/helpers/google/google'
import { OAuthSubscribe } from '@/helpers/google/server'
import { findChat, MessageDeleter } from '@/models'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import { log } from '@/helpers/log'
import { i18n } from '@/helpers/i18n'
import { randomBytes } from 'crypto'
import { adminOrPrivateComposer } from '@/helpers/composers'
import { findOrCreateGoogleData } from '@/models/Google'
import { readFileSync } from 'fs'

export const allowDriveImg = readFileSync('./static/img/allow_drive.png')

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

      await MessageDeleter.process(bot.telegram, dbchat)

      try {
        const tokens = await auth.getToken(code)
        const { email, userId } = await auth.getUserData(tokens)

        let folder
        try {
          folder = await auth.getFolder(tokens, { name: chat_title })
        } catch (err) {
          await bot.telegram.sendPhoto(
            cid,
            { source: allowDriveImg },
            {
              caption: i18n.t(dbchat.language, 'upload_denied'),
              parse_mode: 'Markdown',
            }
          )
          log.error(`[c=${cid}] Error on creating folder: ${err}.`)
          return 500
        }
        const credentials = await findOrCreateGoogleData(userId, email, tokens)
        dbchat.folderId = folder.id
        dbchat.userId = userId

        const msg = i18n
          .t(dbchat.language, 'google_success_' + chat_type)
          .replace('{email}', email)

        await bot.telegram.sendMessage(cid, msg)
      } catch (err) {
        await bot.telegram.sendMessage(
          cid,
          i18n.t(dbchat.language, 'google_failure')
        )
        log.error(`[c=${cid}] Error on getting google auth code: ${err}.`)
        return 500
      } finally {
        await dbchat.save()
      }
      return 200
    }
  )

  bot.command('google', adminOrPrivateComposer(googleHandler(auth)))

  bot.command('signout', adminOrPrivateComposer(signoutHandler))
}

export function googleHandler(auth: IAuthorization) {
  return async function (ctx) {
    await MessageDeleter.process(ctx.telegram, ctx.dbchat)

    const onetimepass = randomBytes(20).toString('hex')
    const state = {
      cid: ctx.chat.id,
      chat_type: ctx.chat_type,
      chat_title: 'title' in ctx.chat ? ctx.chat.title : '',
      onetimepass,
      lang: ctx.dbchat.language,
    }
    ctx.dbchat.onetimepass = onetimepass
    const msgText =
      ctx
        .t('google_signin_md')
        .replace('{0}', auth.getAuthUrl(JSON.stringify(state))) +
      '\n' +
      ctx.t('allow_drive')

    const msg = await ctx.replyWithPhoto(
      { source: allowDriveImg },
      { caption: msgText, parse_mode: 'Markdown' }
    )
    await MessageDeleter.push(ctx.dbchat, msg.message_id)
    await ctx.dbchat.save()
  }
}

export async function signoutHandler(ctx) {
  ctx.dbchat.userId = undefined
  await ctx.dbchat.save()

  return ctx.replyWithMarkdown(ctx.t('google_signout'))
}
