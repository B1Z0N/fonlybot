import { GoogleAuth, Utils } from '@/helpers/google/google'
import { Context, Telegraf } from 'telegraf'

export function setHelp(bot: Telegraf, auth: GoogleAuth) {
    bot.command(['help', 'status'], async (ctx) =>
        ctx.replyWithHTML(
            ctx.i18n.t('help_html') +
                '\n' +
                ctx.i18n.t(
                    ctx.dbuser.credentials
                        ? 'authorized_html'
                        : 'not_authorized_html'
                ) +
                '|' +
                (await auth.getEmail(ctx.dbuser.credentials)) +
                '|' +
                    Utils.privateFolderLinkFromId((await await auth.getFolder(
                        ctx.dbuser.credentials,
                        ctx.dbuser.credentials.folderId
                    )).id)
        )
    )
}
