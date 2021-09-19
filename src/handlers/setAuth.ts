import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Scenes, Telegraf } from 'telegraf'

const GOOGLE_SCENE_ID = 'GOOGLE_AUTH_SCENE'
const GOOGLE_COMMAND = 'google'

export function setupAuthHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    const googleScene = new Scenes.BaseScene<Scenes.SceneContext>(
        GOOGLE_SCENE_ID
    )

    googleScene.on('text', async (ctx) => {
        const code = ctx.message.text
        if (code === `/${GOOGLE_COMMAND}`) {
            ctx.replyWithMarkdown(
                ctx.i18n
                    .t('google_signin_md')
                    .replace('{0}', process.env.GOOGLE)
            )
            return
        }

        try {
            ctx.dbuser.token = await auth.getToken(code)
            ctx.dbuser = await ctx.dbuser.save()

            ctx.reply(ctx.i18n.t('google_success'))
            console.log('Successfully settled up google.')
            ctx.scene.leave()
        } catch (err) {
            ctx.reply(ctx.i18n.t('google_failure'))
            console.error(`Error on getting google auth code: ${err}.`)
            ctx.scene.reenter()
        }
    })

    const stage = new Scenes.Stage([googleScene])
    bot.use(stage.middleware())
    bot.command(
        GOOGLE_COMMAND,
        async (ctx) => await ctx.scene.enter(GOOGLE_SCENE_ID)
    )
}
