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
import { GetAuthHandler } from './handlers/setAuth'
import { i18n, attachI18N } from '@/helpers/i18n'
import { setLanguage, sendLanguage } from '@/handlers/language'
import { attachUser } from '@/middlewares/attachUser'
// Google
import { GoogleAuth } from '@/helpers/google'
import { Context } from 'telegraf'

(async function main() {
  const auth = await GoogleAuth.build()

  // Middlewares
  bot.use(ignoreOldMessageUpdates)
  bot.use(attachUser)
  bot.use(i18n.middleware(), attachI18N)
  // Commands
  bot.command(['help', 'start'], sendHelp)
  bot.command('language', sendLanguage)
  bot.command('auth', GetAuthHandler(auth))
  // Actions
  bot.action(localeActions, setLanguage)
  // Errors
  bot.catch(console.error)

  await bot.launch()
  console.info(`Bot ${bot.botInfo.username} is up and running`)
})()