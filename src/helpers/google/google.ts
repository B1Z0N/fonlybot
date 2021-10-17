import { promises as fs } from 'fs'
import { google, Auth, drive_v3 } from 'googleapis'
import { Readable } from 'stream'
import * as mime from 'mime-types'
import * as path from 'path'


//////////////////////////////////////////////////
// Constants
//////////////////////////////////////////////////


const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json')

export async function GoogleInit() {
  const credentials = await fs.readFile(CREDENTIALS_PATH)
  return GoogleAuth.build(credentials)
}

const SCOPES = [
  'openid email',
  'https://www.googleapis.com/auth/drive.file',
  // removed in favour of 'openid email'
  //'https://www.googleapis.com/auth/userinfo.email',
  //'https://www.googleapis.com/auth/userinfo.profile',
]

const FOLDER_NAME = 'fonly'


//////////////////////////////////////////////////
// Interfaces
//////////////////////////////////////////////////


export interface GDriveFile {
  id?: string
  name?: string
  link?: string
  parentId?: string
}

export interface IUploadInfo {
  url: string
  folderId?: string
}

export interface UserData {
    email: string,
    userId: string,
}

export interface IAuthorization {
  getAuthUrl: (state: any) => string
  getToken: (code: string) => Promise<Auth.Credentials>
  upload: (
    token: Auth.Credentials,
    data: Readable,
    fileName: string,
    folder: GDriveFile
  ) => Promise<GDriveFile>

  getFolder: (
    token: Auth.Credentials,
    folder: GDriveFile
  ) => Promise<GDriveFile>

  getUserData: (token: Auth.Credentials) => Promise<UserData>,
}


//////////////////////////////////////////////////
// Classes
//////////////////////////////////////////////////


class GoogleAuth implements IAuthorization {
  auth: Auth.OAuth2Client

  static build(data) {
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

  async getUserData(tokens: Auth.Credentials) {
    this.auth.setCredentials(tokens)
    const ticket = await this.auth.verifyIdToken({ idToken: tokens.id_token })
    const { email } = ticket.getPayload()
    const userId = ticket.getUserId()

    return { email, userId }
  }

  async upload(
    token: Auth.Credentials,
    data: Readable,
    fileName: string,
    folder: GDriveFile
  ) {
    this.auth.setCredentials(token)
    const drive = google.drive({ version: 'v3', auth: this.auth })

    // TODO
    // should we check on every upload if folder exists?
    // how to beat concurrency when every upload creates its own folder
    // till one of them saves it to db
    // folder.id = (await this.getFolderByDrive(drive, folder)).id

    const mimeType = Utils.mimeType(fileName)
    const fileRes = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType,
        parents: [folder.id],
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

    const res = {
      id: fileRes.data.id,
      name: fileName,
      link: Utils.sharedFileLink(fileRes.data.id),
      parentId: folder.id,
    }
    return res
  }

  private async getFolderByDrive(drive: drive_v3.Drive, folder: GDriveFile) {
    folder.name = folder.name ? `${FOLDER_NAME}/${folder.name}` : FOLDER_NAME

    const createFolder = async () => {
      const folderRes = await drive.files.create({
        requestBody: {
          name: folder.name,
          mimeType: 'application/vnd.google-apps.folder',
        },
      })

      const permissionRes = await drive.permissions.create({
        fileId: folderRes.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      })

      return folderRes
    }

    const res = await (folder.id
      ? await drive.files.get({ fileId: folder.id }).catch(createFolder)
      : await createFolder()
    ).data

    folder.link = Utils.sharedFolderLink(res.id)
    folder.id = res.id

    return folder
  }

  async getFolder(token: Auth.Credentials, folder: GDriveFile) {
    this.auth.setCredentials(token)
    const drive = google.drive({ version: 'v3', auth: this.auth })
    return await this.getFolderByDrive(drive, folder)
  }
}

export abstract class Utils {
  public static mimeType(name: string) {
    return mime.lookup(name) || 'text/plain'
  }

  public static sharedFolderLink(folderId: string) {
    return `https://drive.google.com/drive/u/1/folders/${folderId}?usp=sharing`
  }
  public static sharedFileLink(fileId: string) {
    return `https://drive.google.com/file/d/${fileId}/view?usp=sharing`
  }
}
