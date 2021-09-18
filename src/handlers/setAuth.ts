import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Scenes, Telegraf } from 'telegraf'

export function setupAuthHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    const googleScene = new Scenes.BaseScene<Scenes.SceneContext>('GOOGLE_AUTH_SCENE')
    googleScene.enter((ctx) =>
        ctx.replyWithMarkdown(
            `Signin [here](${process.env.GOOGLE}) and paste the code below`
        )
    )
    googleScene.on('text', async (ctx) => {
        const code = ctx.message.text
        try {
            ctx.dbuser.token = await auth.getToken(code)
            ctx.dbuser.updateOne()
            ctx.reply('Successfully settled up google.')
            console.log('Successfully settled up google.')
            ctx.scene.leave()
        } catch(err) {
            ctx.reply('Something wrong with the code, try again.')
            console.log(`Error on getting google auth code: ${err}.`)
            ctx.scene.reenter()
        }
    })
    
    const stage = new Scenes.Stage([ googleScene ])
    bot.use(stage.middleware())
    bot.command('google', async ctx => await ctx.scene.enter('GOOGLE_AUTH_SCENE'))
}
