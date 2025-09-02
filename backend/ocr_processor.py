# ocr_processor.py
from google.cloud import documentai_v1 as documentai
from google.api_core.client_options import ClientOptions
import google_drive
from config import DOCAI_LOCATION, DOCAI_PROCESSOR_ID, DOCAI_PROJECT_ID

def get_full_document_from_pdf(file_id: str, mime_type: str):
    print(f"    -> Téléchargement du fichier {file_id} depuis Drive...")
    drive_service = google_drive.get_drive_service()
    request = drive_service.files().get_media(fileId=file_id)
    file_content = request.execute()

    print(f"    -> Envoi à l'API Document AI...")
    opts = ClientOptions(api_endpoint=f'{DOCAI_LOCATION}-documentai.googleapis.com')
    client = documentai.DocumentProcessorServiceClient(client_options=opts)
    name = client.processor_path(DOCAI_PROJECT_ID, DOCAI_LOCATION, DOCAI_PROCESSOR_ID)

    raw_document = documentai.RawDocument(content=file_content, mime_type=mime_type)
    request_docai = documentai.ProcessRequest(name=name, raw_document=raw_document)
    result = client.process_document(request=request_docai)

    print("    -> OCR terminé. Objet Document complet récupéré.")
    return result.document