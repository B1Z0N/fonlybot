import { Composer, Markup as m, Telegraf } from 'telegraf'
import { MongoSessionContext } from '@/helpers/bot'
import { readdirSync, readFileSync } from 'fs'
import { safeLoad } from 'js-yaml'
import { adminOrPrivateComposer, isAdminOrPrivate } from '@/helpers/composers'

export function setupLanguageHandlers(
  bot: Telegraf<MongoSessionContext>,
  onFirstLangSetup: (ctx: MongoSessionContext) => Promise<void>
) {
  bot.command('language', adminOrPrivateComposer(sendLanguage))
  bot.action(localeActions, setLanguage(onFirstLangSetup))
}

const localeActions = localesFiles().map((file) => file.split('.')[0])

export function sendLanguage(ctx: MongoSessionContext) {
  return ctx.reply(ctx.t('language'), languageKeyboard())
}

function setLanguage(
  onFirstLangSetup: (ctx: MongoSessionContext) => Promise<void>
) {
  return async function (ctx: MongoSessionContext) {
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

    if (onFirstLangSetup && !ctx.dbchat.inited) {
      await onFirstLangSetup(ctx)
      await ctx.dbchat.updateOne({ inited: true })
    }
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
      result[result.length - 1].push(m.button.callback(localeName, localeCode))
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
