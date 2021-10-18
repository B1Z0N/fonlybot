import { prop, getModelForClass } from '@typegoose/typegoose'
import { Auth } from 'googleapis'
import { log } from '@/helpers/log'

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

  @prop()
  public email: string

  @prop({ required: true, index: true, unique: true })
  public userId: string } 
const GoogleCredentialsModel = getModelForClass(GoogleData, {
  schemaOptions: { timestamps: true },
})

export async function findOrCreateGoogleData(
  userId: string,
  email: string,
  creds: Auth.Credentials
) {
  let found = await GoogleCredentialsModel.findOne({ userId })
  if (!found) {
    // Try/catch is used to avoid race conditions
    try {
      found = new GoogleCredentialsModel({ userId })
    } catch (err) {
      log.error(`[GoogleUserId=${userId}] Error on 'GoogleData' record creation: ${err}`)
      found = await GoogleCredentialsModel.findOne({ userId })
    }
  }

  const tosave = Object.assign(found, { ...creds, email })
  await tosave.save()
  return tosave
}

export async function findGoogleData(userId: string) {
  return await GoogleCredentialsModel.findOne({ userId })
}
