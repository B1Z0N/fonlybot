import I18N from 'telegraf-i18n'
import { Context } from 'telegraf'
const dirtyI18N = require('telegraf-i18n')
import { negateChatType } from '@/middlewares/dbchat'

export const i18n = new dirtyI18N({
    directory: `${__dirname}/../../locales`,
    defaultLanguage: 'en',
    sessionName: 'session',
    useSession: false,
    allowMissing: false,
}) as I18N

export function attachI18N(ctx: Context, next: () => void) {
    const anyI18N = ctx.i18n as any
    anyI18N.locale(ctx.dbchat.language)
    const negated_chat_type = negateChatType(ctx.chat_type)
    ctx.t = (tag) => {
        // neccessary evil for now
        try {
            return ctx.i18n.t(`${tag}_${ctx.chat_type}`)
        } catch {
            try {
                return ctx.i18n.t(tag)
            } catch {
                return ctx.i18n.t(`${tag}_${negated_chat_type}`)
            }
        }
    }
    return next()
}
