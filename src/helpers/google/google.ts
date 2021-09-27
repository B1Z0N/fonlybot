import { promises as fs } from 'fs'
import { google, Auth, drive_v3, people_v1 } from 'googleapis'
import { Readable } from 'stream'
import * as mime from 'mime-types'
import { GaxiosResponse } from 'gaxios'

const SCOPES = ['https://www.googleapis.com/auth/drive', 'https://www.googleapis.com/auth/userinfo.email']
const CREDENTIALS_PATH = `${process.cwd()}/credentials.json`
const FOLDER_NAME = 'fonly'

export interface IAuthorization {
    getAuthUrl: (state: any) => string
    getToken: (code: string) => Promise<Auth.Credentials>
    upload: (
        token: Auth.Credentials,
        data: Readable,
        name: string,
        folderId?: string
    ) => Promise<IUploadInfo>

    getFolder: (
        drive: drive_v3.Drive,
        folderId?: string
    ) => Promise<drive_v3.Schema$File>

    getEmail: (
        token: Auth.Credentials
    ) => Promise<string>
}

export interface IUploadInfo {
    url: string
    folderId?: string
}

export class GoogleAuth implements IAuthorization {
    auth: Auth.OAuth2Client

    static async build() {
        const data = await fs.readFile(CREDENTIALS_PATH)
        const { client_secret, client_id, redirect_uris } = JSON.parse(
            data.toString()
        ).web
        const oauth = new google.auth.OAuth2(
            client_id,
            client_secret,
            redirect_uris
        )

        const gauth = new GoogleAuth()
        gauth.auth = oauth

        return gauth
    }

    getAuthUrl(state: any) {
        return this.auth.generateAuthUrl({
            access_type: 'offline',
            scope: SCOPES,
            state,
        })
    }

    async getToken(code: string) {
        const { tokens } = await this.auth.getToken(code)
        return tokens
    }

    async getEmail(token: Auth.Credentials) {
        this.auth.setCredentials(token)
        const people = google.people({ version: 'v1', auth: this.auth })
        const me = await people.people.get({ resourceName: 'people/me', personFields: 'emailAddresses' })
        return me.data.emailAddresses[0].value;
    }

    async upload(
        token: Auth.Credentials,
        data: Readable,
        name: string,
        folderId?: string
    ) {
        this.auth.setCredentials(token)
        const drive = google.drive({ version: 'v3', auth: this.auth })

        folderId = (await this.getFolder(drive, folderId)).id

        const mimeType = this.getMimeType(name)
        const fileRes = await drive.files.create({
            requestBody: {
                name,
                mimeType,
                parents: [folderId],
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

        return { url: this.fileLinkFromId(fileRes.data.id), folderId }
    }

    async getFolder(drive: drive_v3.Drive, folderId?: string) {
        const createFolder = async () =>
            await drive.files.create({
                requestBody: {
                    name: FOLDER_NAME,
                    mimeType: 'application/vnd.google-apps.folder',
                },
            })

        return await (folderId
            ? await drive.files.get({ fileId: folderId }).catch(createFolder)
            : await createFolder()).data
    }

    private fileLinkFromId(fileId: string) {
        return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
    }

    private getMimeType(name: string) {
        return mime.lookup(name) || 'text/plain'
    }
}

