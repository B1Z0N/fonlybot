import { prop, getModelForClass, Ref } from '@typegoose/typegoose'
import { log } from '@/helpers/log'
import { Telegraf, Telegram } from 'telegraf'
import { MongoSessionContext } from '@/helpers/bot'
import { BeAnObject } from '@typegoose/typegoose/lib/types'
import { Document } from 'mongoose'

export class Chat {
  @prop({ required: true, index: true, unique: true })
  public cid: number

  @prop({ required: true, default: 'en' })
  public language: string

  @prop({ unique: true })
  public userId?: string

  @prop()
  public onetimepass?: string

  // chat only

  @prop({ default: true })
  public active: boolean

  @prop({ type: Number })
  public to_delete_ids: number[]

  // a user that added the bot to the chat has the same permissions
  // as admins of the chat
  @prop()
  public adminid: number

  @prop()
  public folderId: string

  @prop({ default: false })
  public inited: boolean
}

// Get User model
const ChatModel = getModelForClass(Chat, {
  schemaOptions: { timestamps: true },
})

// Get or create user
export async function findOrCreateChat(id: number) {
  let found = await ChatModel.findOne({ cid: id })
  if (!found) {
    // Try/catch is used to avoid race conditions
    try {
      found = await new ChatModel({ cid: id }).save()
    } catch (err) {
      found = await ChatModel.findOne({ cid: id })
    }
  }
  return found
}

export async function findChat(id: number) {
  return await ChatModel.findOne({ cid: id })
}

export class MessageDeleter {
  static process(
    tg: Telegram,
    dbchat: Chat & Document<any, BeAnObject, any>
  ) {
    const towait = []

    for (let todelid of dbchat.to_delete_ids) {
      towait.push(
        tg.deleteMessage(dbchat.cid, todelid).catch(e => {
          log.info(`[${dbchat.cid}] The message was already deleted by someone.`)
        })
      )
    }

    towait.push(dbchat.updateOne({ to_delete_ids: [] }))
    return Promise.all(towait)
  }

  static push(dbchat: Chat & Document<any, BeAnObject, any>, id: number) {
    return dbchat.updateOne({ to_delete_ids: [...dbchat.to_delete_ids, id] })
  }
}