import { prop, getModelForClass, Ref } from '@typegoose/typegoose'
import { GoogleData } from '@/models/Google'

export class Chat {
  @prop({ required: true, index: true, unique: true })
  public cid: number

  @prop({ required: true, default: 'en' })
  public language: string

  @prop()
  public email?: string

  @prop()
  public onetimepass?: string

  // chat only

  @prop({ default: true })
  public active: boolean

  @prop({ type: Number })
  public to_delete_ids: number[]

  @prop()
  public to_edit_id?: number

  // a user that added the bot to the chat has the same permissions
  // as admins of the chat
  @prop()
  public adminid: number
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
