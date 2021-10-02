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
    
    // data

    @prop({ required: true, index: true, unique: true })
    public uid: number

    @prop({ required: true, default: 'en' })
    public language: string

    @prop()
    public credentials?: GoogleCredentials

    @prop()
    onetimepass?: string

    @prop({ default: true })
    on: boolean

    // actions

    private static Model = getModelForClass(Chat, {
        schemaOptions: { timestamps: true },
    })

    public static async findOrCreate(id: number) {
        let chat = await Chat.Model.findOne({ uid: id })
        if (!chat) {
            // Try/catch is used to avoid race conditions
            try {
                chat = await new Chat.Model({ uid: id }).save()
            } catch (err) {
                chat = await Chat.Model.findOne({ uid: id })
            }
        }
        
        return chat
    }

    public static find(id: number) {
        return Chat.Model.findOne({ uid: id })
    }
}

