import { localeActions } from './handlers/language'
// Setup @/ aliases for modules
import 'module-alias/register'
// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${process.cwd()}/.env` })
// Dependencies
import { bot } from '@/helpers/bot'
import { ignoreOldMessageUpdates } from '@/middlewares/ignoreOldMessageUpdates'
import { sendHelp } from '@/handlers/sendHelp'
import { getAuthHandler } from './handlers/setAuth'
import { i18n, attachI18N } from '@/helpers/i18n'
import { setLanguage, sendLanguage } from '@/handlers/language'
import { attachUser } from '@/middlewares/attachUser'
// Google
import { GoogleAuth } from '@/helpers/google'
import { getMongoSession } from '@/middlewares/mongoSession'
import { mongoConnect } from './models'
import { Context } from 'telegraf'

(async function main() {
  await mongoConnect()

  const auth = await GoogleAuth.build()

  // Middlewares
  bot.use(ignoreOldMessageUpdates)
  bot.use(attachUser)
  bot.use(i18n.middleware(), attachI18N)
  bot.use(getMongoSession())
  // Commands
  bot.command(['help', 'start'], sendHelp)
  bot.command('language', sendLanguage)
  bot.command('auth', getAuthHandler(auth))
  // Actions
  bot.action(localeActions, setLanguage)
  // Errors
  bot.catch(console.error)

  bot.command('shit', ctx => {
    ctx.session.count = (ctx.session.count || 0) + 1
    ctx.reply(ctx.session.count)
  })

  await bot.launch()
  console.info(`Bot ${bot.botInfo.username} is up and running`)
})()