import { IAuthorization } from '@/helpers/google/google'
import { OAuthSubscribe } from '@/helpers/google/server'
import { Chat } from '@/models'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import { log } from '@/helpers/log'
import { i18n } from '@/helpers/i18n'
import { randomBytes } from 'crypto'

const GOOGLE_COMMAND = 'google'

export async function setupAuthHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    await OAuthSubscribe(async (cid, onetimepass, code) => {
        const dbchat = await Chat.find(cid)
        if (
            !dbchat ||
            dbchat.onetimepass === undefined ||
            dbchat.onetimepass !== onetimepass
        )
            return 403
        dbchat.onetimepass = undefined

        try {
            dbchat.credentials = await auth.getToken(code)
            await dbchat.save()

            const email = await auth.getEmail(dbchat.credentials)
            bot.telegram.sendMessage(
                cid,
                i18n
                    .t(dbchat.language, 'google_success')
                    .replace('{email}', email)
            )
        } catch (err) {
            bot.telegram.sendMessage(
                cid,
                i18n.t(dbchat.language, 'google_failure')
            )
            log.error(`[c=${cid}] Error on getting google auth code: ${err}.`)
            return 500
        }
        return 200
    })

    bot.command(GOOGLE_COMMAND, async (ctx) => {
        const onetimepass = randomBytes(20).toString('hex')
        const state = {
            cid: ctx.message.chat.id,
            onetimepass,
            lang: ctx.dbchat.language,
        }
        await ctx.dbchat.updateOne({ onetimepass })

        return ctx.replyWithMarkdown(
            ctx.i18n
                .t('google_signin_md')
                .replace('{0}', auth.getAuthUrl(JSON.stringify(state)))
        )
    })
}
