import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import axios from 'axios'
import { Readable } from 'stream'

export function setupUploadHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    bot.on('document', async (ctx) => {
        const { file_id: fileId } = ctx.message.document
        const fileUrl = (await ctx.telegram.getFileLink(fileId)).toString()
        const response = await axios.get(fileUrl, { responseType: "stream" })
        const link = await auth.upload(response.data as Readable, ctx.message.document.file_name, ctx.dbuser.token)
        ctx.replyWithMarkdown(ctx.i18n.t('upload_doc_success').replace('{0}', link))
    })
}
