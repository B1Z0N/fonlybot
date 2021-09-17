import { Telegraf, Context } from 'telegraf'

export interface SessionContext extends Context {
    session: any;
};

export const bot = new Telegraf<SessionContext>(process.env.TOKEN)
