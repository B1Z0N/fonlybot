import { Composer, Context, Markup as m, Telegraf } from 'telegraf'
import { readdirSync, readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { adminOrPrivateComposer, isAdminOrPrivate } from '@/helpers/composers'

export function setupLanguageHandlers(bot: Telegraf) {
    bot.command('language', adminOrPrivateComposer(sendLanguage))
    bot.action(localeActions, setLanguage)
}

const localeActions = localesFiles().map((file) => file.split('.')[0])

function sendLanguage(ctx: Context) {
    return ctx.reply(ctx.t('language'), languageKeyboard())
}

async function setLanguage(ctx: Context) {
    let chat = ctx.dbchat
    if (!(await isAdminOrPrivate(ctx, ctx.callbackQuery.from.id))) {
    	return ctx.answerCbQuery(ctx.t('admin_only'))
    }
    if ('data' in ctx.callbackQuery) {
        chat.language = ctx.callbackQuery.data
        chat = await (chat as any).save()
        const message = ctx.callbackQuery.message

        const anyI18N = ctx.i18n as any
        anyI18N.locale(ctx.callbackQuery.data)

        await ctx.telegram.editMessageText(
            message.chat.id,
            message.message_id,
            undefined,
            ctx.t('language_selected_html'),
            { parse_mode: 'HTML' }
        )
    }
}

function languageKeyboard() {
    const locales = localesFiles()
    const result = []
    locales.forEach((locale, index) => {
        const localeCode = locale.split('.')[0]
        const localeName = safeLoad(
            readFileSync(`${__dirname}/../../locales/${locale}`, 'utf8')
        ).name
        if (index % 2 == 0) {
            if (index === 0) {
                result.push([m.button.callback(localeName, localeCode)])
            } else {
                result[result.length - 1].push(
                    m.button.callback(localeName, localeCode)
                )
            }
        } else {
            result[result.length - 1].push(
                m.button.callback(localeName, localeCode)
            )
            if (index < locales.length - 1) {
                result.push([])
            }
        }
    })
    return m.inlineKeyboard(result)
}

function localesFiles() {
    return readdirSync(`${__dirname}/../../locales`)
}
