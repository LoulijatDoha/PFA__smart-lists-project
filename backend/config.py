# config.py
import os
from dotenv import load_dotenv
import json  
load_dotenv()


#-------------OPENAI------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
#-------------GEMINI------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

#--------------DB-------------------
DB_HOST = os.getenv("DB_HOST")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME")

DB_CONFIG = {
    'host': DB_HOST,
    'user': DB_USER,
    'password': DB_PASSWORD,
    'database': DB_NAME,
    'charset': 'utf8mb4'
}

# S'assurer que les configurations essentielles sont présentes
if not all([GEMINI_API_KEY, DB_HOST, DB_USER, DB_NAME]):
    raise ValueError("Une ou plusieurs variables d'environnement sont manquantes.")


#------------------Google-------------------------
GOOGLE_DRIVE_FOLDER_ID = os.getenv("GOOGLE_DRIVE_FOLDER_ID")

if not GOOGLE_DRIVE_FOLDER_ID:
    raise ValueError("La variable d'environnement GOOGLE_DRIVE_FOLDER_ID est manquante.")


DOCAI_LOCATION = os.getenv("DOCAI_LOCATION")
DOCAI_PROCESSOR_ID = os.getenv("DOCAI_PROCESSOR_ID")
# --- Lecture automatique du Project ID depuis le fichier de credentials -
SERVICE_ACCOUNT_FILE = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")

try:
    with open(SERVICE_ACCOUNT_FILE, 'r') as f:
        credentials_json = json.load(f)
        DOCAI_PROJECT_ID = credentials_json['project_id']
except (FileNotFoundError, KeyError) as e:
    # Si le fichier n'existe pas ou est mal formé, on lève une erreur claire.
    DOCAI_PROJECT_ID = None
    print(f"AVERTISSEMENT: Impossible de lire le Project ID depuis {SERVICE_ACCOUNT_FILE}. Erreur: {e}")


if not (DOCAI_LOCATION):
    raise ValueError("DOCAI_LOCATION est manquante.")
if not (DOCAI_PROCESSOR_ID):
    raise ValueError("DOCAI_LOCATION est manquante.")
if not (DOCAI_PROJECT_ID):
    raise ValueError("DOCAI_LOCATION est manquante.")


# Seuil de confiance pour la recherche sémantique des manuels.
# Seules les suggestions de l'IA avec un score supérieur seront acceptées.
SEUIL_DE_CONFIANCE = 0.85