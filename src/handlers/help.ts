import { Utils, IAuthorization } from '@/helpers/google/google'
import { Telegraf } from 'telegraf'
import { findGoogleData } from '@/models/Google'

export async function setupHelpHandlers(bot: Telegraf, auth: IAuthorization) {
  const genHTMLMsg = async (ctx) => {
    let msg = `${ctx.t('help_html')}\n`

    if (!ctx.dbchat.email) {
      msg += ctx.t('not_authorized_html')
    } else {
      // see helpers/google/google:GoogleAuth:upload todo for details
      //            const folder = await auth.getFolder(ctx.dbchat.credentials, {
      //                id: ctx.dbchat.credentials.folderId,
      //                name: 'title' in ctx.chat ? ctx.chat.title : undefined,
      //            })
      const folderLink = Utils.sharedFolderLink(ctx.dbchat.folderId)
      msg += ctx
        .t('authorized_html')
        .replace('{email}', ctx.dbchat.email)
        .replace('{folder}', folderLink)
    }

    return msg
  }

  bot.command('help', async (ctx) => ctx.replyWithHTML(await genHTMLMsg(ctx)))
  bot.command('start', async (ctx) => {
    const msg = await genHTMLMsg(ctx)
    const userMention = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`
    await ctx.replyWithHTML(ctx.t('hello_html').replace('{name}', userMention))
    return ctx.replyWithHTML(msg)
  })
}
