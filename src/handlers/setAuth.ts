import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Scenes, Telegraf } from 'telegraf'

const GOOGLE_SCENE_ID = 'GOOGLE_AUTH_SCENE'

export function setupAuthHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    const googleScene = new Scenes.BaseScene<Scenes.SceneContext>(GOOGLE_SCENE_ID)
    googleScene.enter(ctx =>
        ctx.replyWithMarkdown(ctx.i18n.t('google_signin').replace('{0}', process.env.GOOGLE))
    )
    googleScene.on('text', async (ctx) => {
        const code = ctx.message.text
        try {
            ctx.dbuser.token = await auth.getToken(code)
            ctx.dbuser = await ctx.dbuser.save()

            ctx.reply(ctx.i18n.t('google_success'))
            console.log('Successfully settled up google.')
            ctx.scene.leave()
        } catch(err) {
            ctx.reply(ctx.i18n.t('google_failure'))
            console.log(`Error on getting google auth code: ${err}.`)
            ctx.scene.reenter()
        }
    })
    
    const stage = new Scenes.Stage([ googleScene ])
    bot.use(stage.middleware())
    bot.command('google', async ctx => await ctx.scene.enter(GOOGLE_SCENE_ID))
}
