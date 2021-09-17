import { Context } from 'telegraf'
import { IAuthorization } from '@/helpers/google'

export function getAuthHandler(auth: IAuthorization) { 
    return async (ctx: Context) => ctx.replyWithHTML('lol') 
}
