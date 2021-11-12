// Setup @/ aliases for modules
import 'module-alias/register'

// Config dotenv
import * as path from 'path'
import * as dotenv from 'dotenv'
dotenv.config({ path: path.join(process.cwd(), '.env') })
// Middlewares
import { ignoreOldMessageUpdates } from '@/middlewares/ignoreOldMessageUpdates'
import { i18n, attachI18N } from '@/helpers/i18n'
import { getMongoSession } from '@/middlewares/mongoSession'
import { attachChat } from '@/middlewares/dbchat'

// Commands
import { setupHelpHandlers, startHandler } from '@/handlers/help'
import { setupAuthHandlers } from '@/handlers/auth'
import { setupUploadHandlers } from '@/handlers/upload'
import { setupLanguageHandlers } from '@/handlers/language'
import { setupChatHandlers } from '@/handlers/chat'

// Other
import { bot } from '@/helpers/bot'
import { IAuthorization, GoogleInit } from '@/helpers/google/google'
import { mongoConnect } from '@/models'
import { log } from '@/helpers/log'
import { throttle } from '@/middlewares/throttle'
;(async function main() {
  const auth = await GoogleInit()
  await mongoConnect()

  // Middlewares
  bot.use(attachChat)
  bot.use(ignoreOldMessageUpdates)
  bot.use(i18n.middleware(), attachI18N)
  bot.use(getMongoSession())
  bot.use(throttle())

  // Commands & actions
  await setupHelpHandlers(bot, auth)
  setupLanguageHandlers(bot, startHandler(auth))
  await setupAuthHandlers(bot, auth)
  setupUploadHandlers(bot, auth)
  setupChatHandlers(bot, auth)

  // Errors
  bot.catch((err, ctx) => {
    log.error(`[c=${ctx.dbchat.cid}] ${err}`)
  })

  // Start
  await bot.launch()
  log.info(`Bot ${bot.botInfo.username} is up and running`)
})()
