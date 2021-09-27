import { Context } from 'telegraf'

export function sendHelp(ctx: Context) {
    return ctx.replyWithHTML(
        ctx.i18n.t('help_html') +
            '\n' +
            ctx.i18n.t(
                ctx.dbuser.credentials
                    ? 'authorized_html'
                    : 'not_authorized_html'
            )
    )
}
