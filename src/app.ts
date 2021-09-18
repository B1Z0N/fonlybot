// Setup @/ aliases for modules
import 'module-alias/register'

// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${process.cwd()}/.env` })

// Middlewares
import { ignoreOldMessageUpdates } from '@/middlewares/ignoreOldMessageUpdates'
import { i18n, attachI18N } from '@/helpers/i18n'
import { getMongoSession } from '@/middlewares/mongoSession'
import { attachUser } from '@/middlewares/attachUser'

// Commands
import { sendHelp } from '@/handlers/sendHelp'
import { setupAuthHandlers } from './handlers/setAuth'
import { setupUploadHandlers } from './handlers/uploadDoc'
import { setLanguage, sendLanguage } from '@/handlers/language'

// Actions
import { localeActions } from './handlers/language'

// Other
import { bot } from '@/helpers/bot'
import { GoogleAuth } from '@/helpers/google'
import { mongoConnect } from './models'


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
  setupAuthHandlers(bot, auth)
  setupUploadHandlers(bot, auth)

  // Actions
  bot.action(localeActions, setLanguage)

  // Errors
  bot.catch(console.error)

  // Start
  await bot.launch()
  console.info(`Bot ${bot.botInfo.username} is up and running`)
})()