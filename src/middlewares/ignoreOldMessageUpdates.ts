import { Context } from 'telegraf'
import { log } from '@/helpers/log'

export async function ignoreOldMessageUpdates(ctx: Context, next: () => any) {
    if (ctx.updateType === 'message') {
        if (new Date().getTime() / 1000 - ctx.message.date < 5 * 60) {
            return next()
        } else {
            log.info(
                `[u=${ctx.from.id}][dt=${ctx.message.date}] Ignoring message`
            )
        }
    } else {
        return next()
    }
}
