import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import { sendLanguage } from '@/handlers/language'
import { IAuthorization } from '@/helpers/google/google'

export function setupChatHandlers(
  bot: Telegraf<MongoSessionContext>,
  auth: IAuthorization
) {
  bot.on('my_chat_member', async (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status
    if (status == 'member') {
      await ctx.dbchat.updateOne({ adminid: ctx.myChatMember.from.id })
      await sendLanguage(ctx)
    } else if (status == 'left') {
      await ctx.dbchat.deleteOne()
    }
  })
}
