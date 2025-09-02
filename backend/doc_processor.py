# doc_processor_improved.py
from google.cloud import documentai
from google.api_core.client_options import ClientOptions
import google_drive
from config import DOCAI_LOCATION, DOCAI_PROCESSOR_ID, DOCAI_PROJECT_ID

def run_workflow_for_single_file(service, fichier):
    """Lance le traitement OCR via Document AI pour un seul fichier."""
    print(f"  -> Lancement de l'OCR pour {fichier['name']}...")
    file_content = google_drive.telecharger_fichier(service, fichier['id'])
    if not file_content:
        return False, "Échec du téléchargement depuis Drive", None

    opts = ClientOptions(api_endpoint=f'{DOCAI_LOCATION}-documentai.googleapis.com')
    client = documentai.DocumentProcessorServiceClient(client_options=opts)
    name = client.processor_path(DOCAI_PROJECT_ID, DOCAI_LOCATION, DOCAI_PROCESSOR_ID)

    mime_type = fichier['mimeType']
    supported_types = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/tiff']
    if mime_type not in supported_types:
        message = f"Format de fichier non supporté par Document AI: {mime_type}"
        print(f"   -> AVERTISSEMENT: {message}")
        return False, message, None

    raw_document = documentai.RawDocument(content=file_content, mime_type=mime_type)
    request = documentai.ProcessRequest(name=name, raw_document=raw_document)

    try:
        result = client.process_document(request=request)
        print("  -> OCR terminé avec succès.")
        return True, "Succès", result.document
    except Exception as e:
        print(f"  -> ERREUR lors du traitement Document AI: {e}")
        return False, str(e), None

def _get_text_anchor_content(text, text_anchor):
    """Extrait le segment de texte basé sur ses ancres."""
    response = ""
    for segment in text_anchor.text_segments:
        start_index = int(segment.start_index)
        end_index = int(segment.end_index)
        response += text[start_index:end_index]
    return response.strip()

def _extract_bounding_box(layout):
    """Extrait les coordonnées de la boîte englobante."""
    if not layout or not layout.bounding_poly: return None
    return [{"x": nv.x, "y": nv.y} for nv in layout.bounding_poly.normalized_vertices] if layout.bounding_poly.normalized_vertices else None

def preprocess_document_for_ia(document):
    """Transforme le document Document AI en texte tagué et en mapping de positions."""
    texte_complet = document.text
    tagged_text = ""
    position_mapping = {}
    element_id = 1

    for page_num, page in enumerate(document.pages):
        page_info = {
            "page_number": page_num + 1,
            "width": page.dimension.width if page.dimension else 0,
            "height": page.dimension.height if page.dimension else 0,
            "unit": page.dimension.unit if page.dimension else "px"
        }
        for line in page.lines:
            line_text = _get_text_anchor_content(texte_complet, line.layout.text_anchor).replace('\n', ' ').strip()
            if line_text:
                tag = f"E{element_id}"
                tagged_text += f"[{tag}] {line_text}\n"
                position_mapping[tag] = {
                    "text": line_text,
                    "page_info": page_info,
                    "bounding_box": _extract_bounding_box(line.layout),
                    "confidence": line.layout.confidence if hasattr(line.layout, 'confidence') else None
                }
                element_id += 1

    return tagged_text, position_mapping