import I18N from 'telegraf-i18n'
import { Chat } from '@/models'
import { ChatType } from '@/middlewares/dbchat'
import { DocumentType } from '@typegoose/typegoose'
import { GoogleAuth } from '@/helpers/google/google'

declare module 'telegraf' {
  export class Context {
    dbchat: DocumentType<Chat>
    chat_type: ChatType
    i18n: I18N
    t: (tag: string) => string
  }
}
