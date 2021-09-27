import { IAuthorization } from '@/helpers/google/google'
import { OAuthSubscribe } from '@/helpers/google/callback_server'
import { findUser } from '@/models'
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
        const dbuser = await findUser(cid)
        if (
            !dbuser ||
            dbuser.onetimepass === undefined ||
            dbuser.onetimepass !== onetimepass
        )
            return 403
        dbuser.onetimepass = undefined

        const send = (msg) =>
            bot.telegram.sendMessage(cid, i18n.t(dbuser.language, msg))

        try {
            dbuser.credentials = await auth.getToken(code)
            await dbuser.save()

            send('google_success')
        } catch (err) {
            send('google_failure')
            log.error(`[u=${cid}] Error on getting google auth code: ${err}.`)
            return 500
        }
        return 200
    })

    bot.command(GOOGLE_COMMAND, async (ctx) => {
        const onetimepass = randomBytes(20).toString('hex')
        const state = {
            cid: ctx.message.chat.id,
            onetimepass,
            lang: ctx.dbuser.language,
        }
        await ctx.dbuser.updateOne({ onetimepass })

        return ctx.replyWithMarkdown(
            ctx.i18n
                .t('google_signin_md')
                .replace('{0}', auth.getAuthUrl(JSON.stringify(state)))
        )
    })
}
