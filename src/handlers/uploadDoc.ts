import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import axios from 'axios'
import { Readable } from 'stream'
import escape from 'markdown-escape'

export function setupUploadHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    bot.on('document', async (ctx) => {
        if (!ctx.dbuser.token) {
            ctx.replyWithMarkdown(ctx.i18n.t('authorize_first_md'))
            return
        }

        const { file_id: fileId, file_name: fileName } = ctx.message.document
        try {
            const fileUrl = (await ctx.telegram.getFileLink(fileId)).toString()
            const response = await axios.get(fileUrl, {
                responseType: 'stream',
            })
            const link = await auth.upload(
                response.data as Readable,
                fileName,
                ctx.dbuser.token
            )
            ctx.replyWithMarkdown(
                escape(
                    ctx.i18n
                        .t('upload_success_md')
                        .replace('{0}', fileName)
                        .replace('{1}', link)
                )
            )
        } catch (err) {
            ctx.replyWithMarkdown(
                escape(ctx.i18n.t('upload_failure_md').replace('{0}', fileName))
            )
            console.error(`Error on uploading file to the drive: ${err}`)
        }
    })
}
