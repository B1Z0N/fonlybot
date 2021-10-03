import { prop, getModelForClass } from '@typegoose/typegoose'
import { Auth } from 'googleapis'

// TODO: maybe we could generate this?
class GoogleCredentials implements Auth.Credentials {
    @prop()
    public access_token?: string

    @prop()
    public refresh_token?: string

    @prop()
    public scope?: string

    @prop()
    public token_type?: string

    @prop()
    public expiry_date?: number

    @prop()
    public folderId?: string
}

export class Chat {
    @prop({ required: true, index: true, unique: true })
    public cid: number

    @prop({ required: true, default: 'en' })
    public language: string

    @prop()
    public credentials?: GoogleCredentials

    @prop()
    onetimepass?: string

    // chat only

    @prop({ default: true })
    active: boolean
}

// Get User model
const ChatModel = getModelForClass(Chat, {
    schemaOptions: { timestamps: true },
})

// Get or create user
export async function findOrCreateChat(id: number) {
    let user = await ChatModel.findOne({ cid: id })
    if (!user) {
        // Try/catch is used to avoid race conditions
        try {
            user = await new ChatModel({ cid: id }).save()
        } catch (err) {
            user = await ChatModel.findOne({ cid: id })
        }
    }
    return user
}

export async function findChat(id: number) {
    return await ChatModel.findOne({ cid: id })
}

