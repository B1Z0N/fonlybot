import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import { startHandler } from '@/handlers/help'
import { IAuthorization } from '@/helpers/google/google'

export function setupChatHandlers(bot: Telegraf<MongoSessionContext>, auth: IAuthorization) {
  bot.on('my_chat_member', async (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status
    if (status == 'member') {
      await ctx.dbchat.updateOne({ adminid: ctx.myChatMember.from.id })
      await startHandler(auth)(ctx)
    } else if (status == 'left') {
      await ctx.dbchat.deleteOne()
    }
  })
}
