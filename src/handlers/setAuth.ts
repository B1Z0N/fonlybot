import { IAuthorization } from '@/helpers/google/google'
import { OAuthEmitter } from '@/helpers/google/callback_server'
import { findUser } from '@/models'
import { MongoSessionContext } from '@/helpers/bot'
import { Scenes, Telegraf } from 'telegraf'
import { log } from '@/helpers/log'
import { i18n } from '@/helpers/i18n'
import { randomBytes } from 'crypto'

const GOOGLE_SCENE_ID = 'GOOGLE_AUTH_SCENE'
const GOOGLE_COMMAND = 'google'

export function setupAuthHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    OAuthEmitter.addListener('signin', async (state, code) => {
	const { cid, onetimepass } = JSON.parse(state);
        const dbuser = await findUser(cid);
	if (dbuser.onetimepass === undefined || dbuser.onetimepass !== onetimepass) return;
	dbuser.onetimepass = undefined

        const send = (msg) => bot.telegram.sendMessage(cid, i18n.t(dbuser.language, msg))

        try {
            dbuser.credentials = await auth.getToken(code)
	    await dbuser.save()

            send('google_success')
        } catch (err) {
            send('google_failure')
            console.error(`Error on getting google auth code: ${err}.`)
        }
    })

    bot.command(GOOGLE_COMMAND, async (ctx) => {
	const onetimepass = randomBytes(20).toString('hex') 
	const state = {
		cid: ctx.message.chat.id, onetimepass
	}
	await ctx.dbuser.updateOne({ onetimepass }) 

        return ctx.replyWithMarkdown(
            ctx.i18n
                .t('google_signin_md')
                .replace('{0}', auth.getAuthUrl(JSON.stringify(state)))
        )
    })
}
