import { IAuthorization } from '@/helpers/google/google'
import { OAuthSubscribe } from '@/helpers/google/server'
import { findChat } from '@/models'
import { MongoSessionContext } from '@/helpers/bot'
import { Telegraf } from 'telegraf'
import { log } from '@/helpers/log'
import { i18n } from '@/helpers/i18n'
import { randomBytes } from 'crypto'
import { adminOrPrivateComposer } from '@/helpers/composers'

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
