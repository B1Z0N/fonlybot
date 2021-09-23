import { prop, getModelForClass, Severity } from '@typegoose/typegoose'
import { Schema } from 'mongoose'
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

export class User {
    @prop({ required: true, index: true, unique: true })
    public uid: number

    @prop({ required: true, default: 'en' })
    public language: string

    @prop()
    public credentials?: GoogleCredentials

    @prop()
    onetimepass?: string
}

// Get User model
const UserModel = getModelForClass(User, {
    schemaOptions: { timestamps: true },
})

// Get or create user
export async function findUser(id: number) {
    let user = await UserModel.findOne({ uid: id })
    if (!user) {
        // Try/catch is used to avoid race conditions
        try {
            user = await new UserModel({ uid: id }).save()
        } catch (err) {
            user = await UserModel.findOne({ uid: id })
        }
    }
    return user
}
