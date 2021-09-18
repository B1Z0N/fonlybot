import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Scenes, Telegraf } from 'telegraf'
import axios from 'axios'
import { Readable } from 'stream'

const UPLOAD_SCENE_ID = 'UPLOAD_DOC_SCENE'

export function setupUploadHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    const uploadScene = new Scenes.BaseScene<Scenes.SceneContext>(
        UPLOAD_SCENE_ID
    )
    uploadScene.enter((ctx) =>
        ctx.replyWithMarkdown(
            ctx.i18n.t('upload_doc_enter').replace('{0}', process.env.GOOGLE)
        )
    )

    uploadScene.on('document', async (ctx) => {
        const { file_id: fileId } = ctx.message.document
        const fileUrl = (await ctx.telegram.getFileLink(fileId)).toString()
        const response = await axios.get(fileUrl)
        
        var s = new Readable()
        s.push(response.data)    // the string you want
        s.push(null)    

        const link = await auth.upload(s, ctx.message.document.file_name, ctx.dbuser.token)
        ctx.replyWithMarkdown(ctx.i18n.t('upload_doc_success').replace('{0}', link))

        ctx.scene.leave()
    })
    // uploadScene.on('document', async (ctx) => {
    //     const fileid = ctx.message.document.file_id
    //     try {
    //         const file = await ctx.telegram.getFileLink(fileid)
    //         const link = await auth.upload()
    //         ctx.dbuser.updateOne()

    //         ctx.reply(ctx.i18n.t('upload_doc_success').replace('{0}'))
    //         console.log('Successfully settled up google.')
    //         ctx.scene.leave()
    //     } catch (err) {
    //         ctx.reply(ctx.i18n.t('upload_doc_failure'))
    //         console.log(`Error on getting google auth code: ${err}.`)
    //         ctx.scene.reenter()
    //     }
    // })

    const stage = new Scenes.Stage([uploadScene])
    bot.use(stage.middleware())
    bot.command('upload', async ctx => await ctx.scene.enter(UPLOAD_SCENE_ID))
}
