import { Context, Telegraf } from 'telegraf'
import { GoogleAuth, CREDENTIALS_PATH } from '@/helpers/google/google'
import { promises as fs } from 'fs'

export async function setupAuthMiddleware(bot: Telegraf) {
    const credentials = await fs.readFile(CREDENTIALS_PATH)

    bot.use((ctx, next) => {
        ctx.auth = GoogleAuth.build(credentials)

        return next()
    })
}
