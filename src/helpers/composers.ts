import { Composer, Context, MiddlewareFn, Telegraf } from 'telegraf'
import { MongoSessionContext } from '@/helpers/bot'

export function adminOrPrivateComposer(fn: MiddlewareFn<MongoSessionContext>) {
  return Composer.branch(
    (ctx) => ctx.chat.type === 'private',
    fn,
    myAdminComposer(fn)
  )
}

function myAdminComposer(fn: MiddlewareFn<MongoSessionContext>) {
  return Composer.branch(
    (ctx) => ctx.dbchat.adminid === ctx.from.id,
    fn,
    Composer.admin(fn)
  )
}

export async function isAdminOrPrivate(ctx: Context, uid: number) {
  if (ctx.chat.type == 'private') return true
  const admins = await getMyAdmins(ctx)
  return admins.find((id) => id === uid) != undefined
}

async function getMyAdmins(ctx: Context) {
  const admins = await ctx.getChatAdministrators()
  return [ctx.dbchat.adminid, ...admins.map((a) => a.user.id)]
}
