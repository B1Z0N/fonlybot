import { Composer, Context, MiddlewareFn, Telegraf } from 'telegraf'
import { MongoSessionContext } from '@/helpers/bot'

export function adminOrPrivateComposer(fn: MiddlewareFn<Context>) {
    return Composer.branch(
        (ctx) => ctx.chat.type === 'private',
        fn,
        Composer.admin(fn)
    )
}

export async function isAdminOrPrivate(ctx: Context, uid: number) {
    if (ctx.chat.type == 'private') return true
    const admins = await ctx.getChatAdministrators()
    return admins.find((a) => a.user.id == uid) != undefined
}
