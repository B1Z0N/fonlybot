import { GoogleAuth, Utils } from '@/helpers/google/google'
import { Context, Telegraf } from 'telegraf'

export function setupHelpHandlers(bot: Telegraf, auth: GoogleAuth) {
    const genHTMLMsg = async (ctx) => {
        let msg = `${ctx.i18n.t('help_html')}\n`

        if (!ctx.dbchat.credentials) {
            msg += ctx.i18n.t('not_authorized_html')
        } else {
            const email = await auth.getEmail(ctx.dbchat.credentials)
            const folder = await auth.getFolder(
                ctx.dbchat.credentials,
                ctx.dbchat.credentials.folderId
            )
            const folderLink = Utils.privateFolderLink(folder.id)

            ctx.dbchat.credentials.folderId = folder.id
            ctx.dbchat = await ctx.dbchat.save()

            msg += ctx.i18n
                .t('authorized_html')
                .replace('{email}', email)
                .replace('{folder}', folderLink)
        }

        return msg
    }

    bot.command('help', async (ctx) => ctx.replyWithHTML(await genHTMLMsg(ctx)))
    bot.command('start', async (ctx) => {
        const msg = await genHTMLMsg(ctx)
        const userMention = `<a href="tg://user?id=${ctx.from.id}">${ctx.from.first_name}</a>`
        await ctx.replyWithHTML(
            ctx.i18n.t('hello_html').replace('{name}', userMention)
        )
        await ctx.replyWithHTML(msg)
    })
}
