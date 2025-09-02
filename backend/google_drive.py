# google_drive.py
import os.path
import io
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
from googleapiclient.http import MediaIoBaseDownload

SCOPES = ["https://www.googleapis.com/auth/drive"]
def get_drive_service():
    """Crée et retourne un service d'API Google Drive authentifié."""
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
    try:
        service = build('drive', 'v3', credentials=creds)
        print("Authentification Google Drive réussie.")
        return service
    except Exception as e:
        print(f"Erreur lors de la création du service Drive: {e}")
        return None

def telecharger_fichier(service, file_id):
    """Télécharge le contenu d'un fichier depuis Google Drive."""
    try:
        request = service.files().get_media(fileId=file_id)
        file_handle = io.BytesIO()
        downloader = MediaIoBaseDownload(file_handle, request)
        done = False
        while done is False:
            status, done = downloader.next_chunk()
        return file_handle.getvalue()
    except Exception as e:
        print(f"   -> ERREUR lors du téléchargement du fichier {file_id}: {e}")
        return None

# --- MODIFICATION (Problème #11) ---
# Ajout d'une fonction récursive pour trouver les fichiers dans les sous-dossiers.
def lister_fichiers_recursif(service, folder_id):
    """Liste tous les fichiers dans un dossier et ses sous-dossiers, de manière récursive."""
    all_files = []
    page_token = None
    print(f"Recherche de fichiers dans le dossier ID: {folder_id}...")
    while True:
        try:
            query = f"'{folder_id}' in parents and trashed=false"
            response = service.files().list(q=query,
                                            spaces='drive',
                                            fields='nextPageToken, files(id, name, mimeType)',
                                            pageToken=page_token).execute()
            
            for item in response.get('files', []):
                # Si c'est un dossier, on explore son contenu
                if item.get('mimeType') == 'application/vnd.google-apps.folder':
                    print(f"  -> Découverte du sous-dossier: {item.get('name')}")
                    all_files.extend(lister_fichiers_recursif(service, item.get('id')))
                # Si c'est un fichier, on l'ajoute à la liste
                else:
                    all_files.append(item)
            
            page_token = response.get('nextPageToken', None)
            if page_token is None:
                break
        except Exception as e:
            print(f"Une erreur est survenue lors du listage des fichiers : {e}")
            break
            
    return all_files

