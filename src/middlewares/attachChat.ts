import { findOrCreateChat } from '@/models'
import { Context } from 'telegraf'

export type ChatType = 'pr' | 'pub'
export function negateChatType(t: ChatType) {
	return t == 'pr' ? 'pub' : 'pr'
}

export async function attachChat(ctx: Context, next: () => void) {
    ctx.dbchat = await findOrCreateChat(ctx.chat.id)
    ctx.chat_type = ctx.chat.type == 'private' ? 'pr' : 'pub';
    
    return next()
}
