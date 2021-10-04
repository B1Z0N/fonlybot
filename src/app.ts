// Setup @/ aliases for modules
import 'module-alias/register'

// Config dotenv
import * as dotenv from 'dotenv'
dotenv.config({ path: `${process.cwd()}/.env` })

// Middlewares
import { ignoreOldMessageUpdates } from '@/middlewares/ignoreOldMessageUpdates'
import { i18n, attachI18N } from '@/helpers/i18n'
import { getMongoSession } from '@/middlewares/mongoSession'
import { attachChat } from '@/middlewares/attachChat'

// Commands
import { setupHelpHandlers } from '@/handlers/help'
import { setupAuthHandlers } from './handlers/auth'
import { setupUploadHandlers } from './handlers/upload'
import { setupLanguageHandlers } from '@/handlers/language'

// Other
import { bot } from '@/helpers/bot'
import { GoogleAuth } from '@/helpers/google/google'
import { mongoConnect } from './models'
import { log } from '@/helpers/log'

;(async function main() {
    await mongoConnect()

    const auth = await GoogleAuth.build()

    // Middlewares
    bot.use(ignoreOldMessageUpdates)
    bot.use(attachChat)
    bot.use(i18n.middleware(), attachI18N)
    bot.use(getMongoSession())

    // Commands & actions
    await setupHelpHandlers(bot, auth)
    setupLanguageHandlers(bot)
    await setupAuthHandlers(bot, auth)
    setupUploadHandlers(bot, auth)

    // Errors
    bot.catch((err, ctx) => {
        log.error(`[c=${ctx.dbchat.id}] ${err}`)
    })

    // Start
    await bot.launch()
    log.info(`Bot ${bot.botInfo.username} is up and running`)
})()
