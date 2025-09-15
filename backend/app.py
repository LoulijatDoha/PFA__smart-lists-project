# Prototyping/app.py

# --- Imports des Librairies Externes ---
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
import os
from dotenv import load_dotenv
import database
from models import User

# --- Chargement des variables d'environnement ---
load_dotenv()

# --- INITIALISATION DE L'APPLICATION ---
app = Flask(__name__)
CORS(app, supports_credentials=True)

# --- CONFIGURATION SÉCURISÉE DE LA SECRET_KEY ---
SECRET_KEY = os.getenv('SECRET_KEY')
if not SECRET_KEY:
    print("AVERTISSEMENT : SECRET_KEY non définie. Utilisation d'une clé de développement.")
    SECRET_KEY = 'dev-secret-key'
app.config['SECRET_KEY'] = SECRET_KEY

# --- CONFIGURATION DE FLASK-LOGIN ---
login_manager = LoginManager()
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    # Cette fonction est maintenant correcte car notre classe User a été simplifiée
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        user_dict = cursor.fetchone()
        if not user_dict:
            return None
        return User(
            id=user_dict['id'], 
            username=user_dict['username'], 
            role=user_dict['role'],
            must_change_password=user_dict.get('must_change_password', False)
        )
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

# --- ENREGISTREMENT DES ROUTES (BLUEPRINTS) ---
from routes.auth import auth_bp
from routes.users import users_bp
from routes.lists import lists_bp
from routes.manuels import manuels_bp
from routes.locations import locations_bp
from routes.dashboard import dashboard_bp
from routes.files import files_bp
from routes.standardisation import standardisation_bp 
from routes.drive import drive_bp
from routes.logs import logs_bp  
from routes.entities import entities_bp as api_entities_bp
from routes.referentiel import ref_bp 
from routes.niveaux import niveaux_bp
from routes.profile import profile_bp
from routes.statistics import statistics_bp 


app.register_blueprint(auth_bp, url_prefix='/api/v1')
app.register_blueprint(users_bp, url_prefix='/api/v1/users')
app.register_blueprint(lists_bp, url_prefix='/api/v1/listes')
app.register_blueprint(manuels_bp, url_prefix='/api/v1/manuels')
app.register_blueprint(locations_bp, url_prefix='/api/v1/locations')
app.register_blueprint(dashboard_bp, url_prefix='/api/v1/dashboard')
app.register_blueprint(files_bp, url_prefix='/api/v1/processing')
app.register_blueprint(standardisation_bp, url_prefix='/api/v1/standardisation')
app.register_blueprint(drive_bp, url_prefix='/api/v1/drive')
app.register_blueprint(logs_bp, url_prefix='/api/v1/logs') 
app.register_blueprint(api_entities_bp, url_prefix='/api/v1/entities')
app.register_blueprint(ref_bp, url_prefix='/api/v1/referentiel')
app.register_blueprint(niveaux_bp, url_prefix='/api/v1/niveaux')
app.register_blueprint(profile_bp, url_prefix='/api/v1/profile')
app.register_blueprint(statistics_bp, url_prefix='/api/v1/statistics')




if __name__ == '__main__':
    app.run(debug=True, port=5000)