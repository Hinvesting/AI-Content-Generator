import { GeneratedImages, ParsedDocument, DocType } from '../types';

// Fix: Add declarations for gapi and google which are loaded from external scripts.
declare const gapi: any;
declare const google: any;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const API_KEY = process.env.GOOGLE_API_KEY || '';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

let tokenClient: google.accounts.oauth2.TokenClient | null = null;
let gapiInited = false;
let gisInited = false;

// Helper to convert Base64 to Blob
const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
};

const gapiLoad = () => new Promise<void>((resolve) => gapi.load('client', resolve));
const gisLoad = () => new Promise<void>((resolve) => {
    // GIS script is already loaded in index.html, so we can just resolve.
    resolve();
});

const initializeGapiClient = async (): Promise<void> => {
    if (!API_KEY) throw new Error("Google API Key is not configured.");
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: [DISCOVERY_DOC],
    });
    gapiInited = true;
};

export const initGis = (): void => {
    if (!CLIENT_ID) {
        console.error("Google Client ID is not configured.");
        return;
    }
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: '', // Callback is handled by the promise wrapper
    });
    gisInited = true;
};

const getToken = (): Promise<google.accounts.oauth2.TokenResponse> => {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            return reject(new Error('GSI client not initialized.'));
        }
        tokenClient.callback = (resp: any) => {
            if (resp.error !== undefined) {
                return reject(resp);
            }
            resolve(resp);
        };
        
        if (gapi.client.getToken() === null) {
            tokenClient.requestAccessToken({ prompt: 'consent' });
        } else {
            tokenClient.requestAccessToken({ prompt: '' });
        }
    });
};

const createFolder = async (folderName: string): Promise<string> => {
    const response = await gapi.client.drive.files.create({
        resource: {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
    });
    return response.result.id!;
};

const uploadFile = async (folderId: string, fileName: string, fileData: Blob | string, mimeType: string) => {
    const metadata = {
        name: fileName,
        parents: [folderId],
    };

    const blobData = typeof fileData === 'string' ? b64toBlob(fileData, mimeType) : fileData;
    
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blobData);

    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': 'Bearer ' + gapi.client.getToken().access_token }),
        body: form,
    });
    
    if (!res.ok) {
        const errorBody = await res.json();
        throw new Error(`Failed to upload ${fileName}: ${errorBody.error.message}`);
    }

    return res.json();
};

export const uploadFilesToDrive = async (images: GeneratedImages, doc: ParsedDocument, folderName: string): Promise<void> => {
    if (!gapiInited) await gapiLoad().then(initializeGapiClient);
    if (!gisInited) await gisLoad().then(initGis);

    await getToken();

    const folderId = await createFolder(folderName);

    const uploadPromises: Promise<any>[] = [];

    // Upload script files
    if(doc.voiceoverScript) {
        const scriptBlob = new Blob([doc.voiceoverScript], {type: 'text/plain'});
        uploadPromises.push(uploadFile(folderId, 'voiceover_script.txt', scriptBlob, 'text/plain'));
    }
     if(doc.docType === DocType.PODCAST || doc.docType === DocType.ARTICLE || doc.docType === DocType.BLOG) {
        const contentBlob = new Blob([doc.rawContent], {type: 'text/plain'});
        uploadPromises.push(uploadFile(folderId, 'full_content.txt', contentBlob, 'text/plain'));
    }

    // Upload images
    for (const key in images) {
        const fileName = `${key.replace(/-/g, '_')}.png`;
        uploadPromises.push(uploadFile(folderId, fileName, images[key], 'image/png'));
    }
    
    await Promise.all(uploadPromises);
};