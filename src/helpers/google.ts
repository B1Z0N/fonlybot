import { promises as fs } from 'fs'
import { google, Auth, drive_v3 } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/drive.metadata.readonly']
const REDIRECT_URL = 'urn:ietf:wg:oauth:2.0:oob'
const CREDENTIALS_PATH = `${process.cwd()}/credentials.json`

export interface IAuthorization {
  getAuthUrl: () => Promise<string>
  getToken: (code: string) => Promise<Auth.Credentials>
}

export class GoogleAuth implements IAuthorization {
  auth: Auth.OAuth2Client

  static async build() {
    const data = await fs.readFile(CREDENTIALS_PATH)
    const { client_secret, client_id, redirect_uris } = JSON.parse(
      data.toString()
    ).installed
    const oauth = new google.auth.OAuth2(client_id, client_secret, REDIRECT_URL)
    
    const gauth = new GoogleAuth();
    gauth.auth = oauth;
    return gauth;
  }

  async getAuthUrl() {
    return this.auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    })
  }

  async getToken(code: string) {
    const { tokens } = await this.auth.getToken(code)
    return tokens
  }
}
