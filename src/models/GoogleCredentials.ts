import { prop, getModelForClass } from '@typegoose/typegoose'
import { Auth } from 'googleapis'

export class GoogleCredentials implements Auth.Credentials {
  @prop({ required: true, index: true, unique: true })
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

const GoogleCredentialsModel = getModelForClass(GoogleCredentials, {
  schemaOptions: { timestamps: true },
})

// Get or create user
export async function findOrCreateGoogleCredentials(creds: Auth.Credentials) {
  const { access_token } = creds
  let found = await GoogleCredentialsModel.findOne({ access_token })
  if (!found) {
    // Try/catch is used to avoid race conditions
    try {
      found = await new GoogleCredentialsModel(creds).save()
    } catch (err) {
      found = await GoogleCredentialsModel.findOne({ access_token })
    }
  }
  return found
}

export async function findGoogleCredentials(creds: Auth.Credentials) {
  return await GoogleCredentialsModel.findOne({
    access_token: creds.access_token,
  })
}
