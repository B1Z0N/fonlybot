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
import { GoogleAuth } from '@/helpers/google/google'
import { mongoConnect } from './models'
import { log } from '@/helpers/log'
;(async function main() {
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
    await setupAuthHandlers(bot, auth)
    setupUploadHandlers(bot, auth)

    // Actions
    bot.action(localeActions, setLanguage)

    // Errors
    bot.catch((err, ctx) => {
        log.error(`[u=${ctx.dbuser.uid}] ${err}`)
    })

    // Start
    await bot.launch()
    log.info(`Bot ${bot.botInfo.username} is up and running`)
})()
