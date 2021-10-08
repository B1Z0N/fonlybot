import { Utils, IAuthorization } from '@/helpers/google/google'
import { Telegraf } from 'telegraf'
import { MongoSessionContext } from '@/helpers/bot'
import { findGoogleData } from '@/models/Google'
import { googleHandler } from '@/handlers/auth'
import { sendLanguage } from '@/handlers/language'

function helpHandlerMsg(ctx) {
    let msg = `${ctx.t('help_html')}\n`

    if (!ctx.dbchat.email) {
      msg += ctx.t('not_authorized_html')
    } else {
      const folderLink = Utils.sharedFolderLink(ctx.dbchat.folderId)
      msg += ctx
        .t('authorized_html')
        .replace('{email}', ctx.dbchat.email)
        .replace('{folder}', folderLink)
    }

    return msg
}

function startHandlerMsg(ctx) {
    const userMention = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`
    const hello = ctx.t('hello_html').replace('{name}', userMention)
    const info = ctx.t('help_html')
    return `${hello} ${info}`
}

export function startHandler(auth: IAuthorization) {
    return async function(ctx) {
        await ctx.replyWithHTML(startHandlerMsg(ctx))
        await googleHandler(auth)(ctx)
    }


}

export async function setupHelpHandlers(bot: Telegraf<MongoSessionContext>, auth: IAuthorization) {
  bot.command('help', ctx => ctx.replyWithHTML(helpHandlerMsg(ctx)))
  bot.command('start', sendLanguage)
}
