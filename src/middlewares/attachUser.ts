import { findOrCreateUser } from '@/models'
import { Context } from 'telegraf'

export async function attachUser(ctx: Context, next: () => void) {
    ctx.dbuser = await findOrCreateUser(ctx.from.id)
    return next()
}
