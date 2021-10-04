import { GoogleAuth, Utils } from '@/helpers/google/google'
import { Telegraf } from 'telegraf'

export function setupHelpHandlers(bot: Telegraf) {
    const genHTMLMsg = async (ctx) => {
        let msg = `${ctx.t('help_html')}\n`

        if (!ctx.dbchat.credentials) {
            msg += ctx.t('not_authorized_html')
        } else {
            const email = await ctx.auth.getEmail(ctx.dbchat.credentials)
            const folder = await ctx.auth.getFolder(ctx.dbchat.credentials, {
                id: ctx.dbchat.credentials.folderId,
                name: 'title' in ctx.chat ? ctx.chat.title : undefined,
            })
            const folderLink = Utils.sharedFolderLink(folder.id)

            ctx.dbchat.credentials.folderId = folder.id
            ctx.dbchat = await ctx.dbchat.save()

            msg += ctx
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
            ctx.t('hello_html').replace('{name}', userMention)
        )
        return ctx.replyWithHTML(msg)
    })
}
