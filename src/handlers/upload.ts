import { chatAdminsOrSignedInComposer } from '@/helpers/chatAdmin'
import { IAuthorization } from '@/helpers/google/google'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf, Composer } from 'telegraf'
import axios from 'axios'
import { Readable } from 'stream'
import { log } from '@/helpers/log'

const MAX_FILE_UPLOAD_SIZE = 20 * 1024 * 1024 // 20mb
const IGNORED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/gif',
    'image/png',
    'audio/mpeg',
    'video/quicktime',
    'video/mp4',
    'image/webp',
])


export function setupUploadHandlers(
    bot: Telegraf<MongoSessionContext>,
    auth: IAuthorization,
    ignoredMimeTypes: Set<string> = IGNORED_MIME_TYPES
) {
    bot.command('on', Composer.admin(async ctx => {
        await ctx.dbchat.updateOne({ active: false })
    }))

    bot.command('off', Composer.admin(async ctx => {
        await ctx.dbchat.updateOne({ active: true })
    }))

    bot.on('document', async ctx => {
        if (ctx.dbchat.active) return
        if (ignoredMimeTypes.has(ctx.message.document.mime_type)) return
        if (!ctx.dbchat.credentials) {
            ctx.replyWithMarkdown(ctx.i18n.t('authorize_first_md'))
            return
        }

        const {
            file_id: fileId,
            file_name: fileName,
            file_size: fileSize,
        } = ctx.message.document

        if (fileSize > MAX_FILE_UPLOAD_SIZE) {
            ctx.reply(ctx.i18n.t('upload_too_big').replace('{0}', fileName), {
                reply_to_message_id: ctx.message.message_id,
            })
            return
        }

        try {
            const tgFileUrl = (
                await ctx.telegram.getFileLink(fileId)
            ).toString()
            const response = await axios.get(tgFileUrl, {
                responseType: 'stream',
            })
            const { url: googleFileUrl, folderId } = await auth.upload(
                ctx.dbchat.credentials,
                response.data as Readable,
                fileName,
                ctx.dbchat.credentials.folderId
            )

            ctx.dbchat.credentials.folderId = folderId
            ctx.dbchat = await ctx.dbchat.save()

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
            log.error(
                `[c=${ctx.dbchat.cid}] Error on uploading file to the drive: ${err}`
            )
        }
    })
}
