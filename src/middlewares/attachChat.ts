import { findOrCreateChat } from '@/models'
import { Context } from 'telegraf'

export async function attachChat(ctx: Context, next: () => void) {
    ctx.dbchat = await findOrCreateChat(ctx.chat.id)
    return next()
}
