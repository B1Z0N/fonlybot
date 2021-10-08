import { prop, getModelForClass } from '@typegoose/typegoose'
import { Auth } from 'googleapis'

export class GoogleData implements Auth.Credentials {
  @prop()
  public access_token?: string

  @prop()
  public refresh_token: string

  @prop()
  public scope?: string

  @prop()
  public token_type?: string

  @prop()
  public expiry_date?: number

  @prop({ required: true, index: true, unique: true })
  public email: string
}

const GoogleCredentialsModel = getModelForClass(GoogleData, {
  schemaOptions: { timestamps: true },
})

export async function findOrCreateGoogleData(
  email: string,
  creds: Auth.Credentials
) {
  let found = await GoogleCredentialsModel.findOne({ email })
  if (!found) {
    // Try/catch is used to avoid race conditions
    try {
      found = new GoogleCredentialsModel({ email })
    } catch (err) {
      found = await GoogleCredentialsModel.findOne({ email })
    }
  }

  await found.updateOne(creds)
  return found
}

export async function findGoogleData(email: string) {
  return await GoogleCredentialsModel.findOne({ email })
}
