import { promises as fs } from 'fs'
import { google, Auth, drive_v3 } from 'googleapis'
import { Readable } from 'stream'
import * as mime from 'mime-types'

const SCOPES = 'https://www.googleapis.com/auth/drive'
const REDIRECT_URL = 'urn:ietf:wg:oauth:2.0:oob'
const CREDENTIALS_PATH = `${process.cwd()}/credentials.json`

export interface IAuthorization {
    getAuthUrl: () => Promise<string>
    getToken: (code: string) => Promise<Auth.Credentials>
    upload: (
        data: Readable,
        name: string,
        token: Auth.Credentials
    ) => Promise<string>
}

export class GoogleAuth implements IAuthorization {
    auth: Auth.OAuth2Client

    static async build() {
        const data = await fs.readFile(CREDENTIALS_PATH)
        const { client_secret, client_id, redirect_uris } = JSON.parse(
            data.toString()
        ).installed
        const oauth = new google.auth.OAuth2(
            client_id,
            client_secret,
            REDIRECT_URL
        )

        const gauth = new GoogleAuth()
        gauth.auth = oauth
        return gauth
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

    async upload(data: Readable, name: string, token: Auth.Credentials) {
        this.auth.setCredentials(token)
        const drive = google.drive({ version: 'v3', auth: this.auth })

        const mimeType = this.getMimeType(name)
        const fileRes = await drive.files.create({
            requestBody: {
                name,
                mimeType,
            },
            media: {
                mimeType,
                body: data,
            },
        })

        const permissionRes = await drive.permissions.create({
            fileId: fileRes.data.id,
            requestBody: {
                role: 'reader',
                type: 'anyone',
            },
        })

        return this.fileLinkFromId(fileRes.data.id)
    }

    private fileLinkFromId(fileId: string) {
        return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    }

    private getMimeType(name: string) {
        return mime.lookup(name) || 'text/plain'
    }
}
