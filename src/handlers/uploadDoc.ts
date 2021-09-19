import { IAuthorization } from '@/helpers/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import axios from 'axios'
import { Readable } from 'stream'
import * as escape from 'markdown-escape'

export function setupUploadHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization
) {
    bot.on('document', async (ctx) => {
        if (!ctx.dbuser.credentials) {
            ctx.replyWithMarkdown(ctx.i18n.t('authorize_first_md'))
            return
        }

        const { file_id: fileId, file_name: fileName } = ctx.message.document
        try {
            const tgFileUrl = (await ctx.telegram.getFileLink(fileId)).toString()
            const response = await axios.get(tgFileUrl, {
                responseType: 'stream',
            })
            const { url: googleFileUrl, folderId } = await auth.upload(
                ctx.dbuser.credentials,
                response.data as Readable,
                fileName,
                ctx.dbuser.credentials.folderId
            )

            ctx.dbuser.credentials.folderId = folderId
            ctx.dbuser = await ctx.dbuser.save()

            ctx.replyWithMarkdown(
                ctx.i18n
                    .t('upload_success_md')
                    .replace('{0}', fileName)
                    .replace('{1}', googleFileUrl),
                { reply_to_message_id: ctx.message.message_id }
            )
        } catch (err) {
            ctx.replyWithMarkdown(
                ctx.i18n.t('upload_failure_md').replace('{0}', fileName),
                { reply_to_message_id: ctx.message.message_id }
            )
            console.error(`Error on uploading file to the drive: ${err}`)
        }
    })
}
