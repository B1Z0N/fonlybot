import I18N from 'telegraf-i18n'
import { Chat } from '@/models'
import { ChatType } from '@/middlewares/attachChat'
import { DocumentType } from '@typegoose/typegoose'

declare module 'telegraf' {
    export class Context {
        dbchat: DocumentType<Chat>
        chat_type: ChatType
        i18n: I18N
        t: (tag: string) => string
    }
}
