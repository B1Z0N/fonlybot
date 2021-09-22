import { IAuthorization } from '@/helpers/google/google'
import { OAuthEmitter } from '@/helpers/google/callback_server'
import { findUser } from '@/models'
import { MongoSessionContext } from '@/helpers/bot'
import { Scenes, Telegraf } from 'telegraf'
import { log } from '@/helpers/log'

const GOOGLE_SCENE_ID = 'GOOGLE_AUTH_SCENE'
const GOOGLE_COMMAND = 'google'

export function setupAuthHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    OAuthEmitter.addListener('signin', async (userId, code) => {
        const dbuser = await findUser(userId)
        const send = (msg) => bot.telegram.sendMessage(userId, msg)
        try {
            await dbuser.updateOne({
                credentials: await auth.getToken(code),
            })

            send('google_success')
        } catch (err) {
            send('google_failure')
            log.error(
                `[u='${userId}'] Error on getting google auth code: ${err}.`
            )
        }
    })

    bot.command(GOOGLE_COMMAND, async (ctx) =>
        ctx.replyWithMarkdown(
            ctx.i18n
                .t('google_signin_md')
                .replace('{0}', auth.getAuthUrl(ctx.message.chat.id))
        )
    )
}
