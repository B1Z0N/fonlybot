import { Chat } from '@/models'
import { Context } from 'telegraf'

export async function attachUser(ctx: Context, next: () => void) {
    ctx.dbchat = await Chat.findOrCreate(ctx.from.id)
    return next()
}
