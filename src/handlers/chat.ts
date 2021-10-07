import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'

export function setupChatHandlers(bot: Telegraf<MongoSessionContext>) {
  bot.on('my_chat_member', async (ctx) => {
    const status = ctx.myChatMember.new_chat_member.status
    if (status == 'member') {
      await ctx.dbchat.updateOne({ adminid: ctx.myChatMember.from.id })
    } else if (status == 'left') {
      await ctx.dbchat.deleteOne()
    }
  })
}
