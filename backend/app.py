# Prototyping/app.py
from flask import Flask
from flask_cors import CORS
from flask_login import LoginManager
import database
from models import User

# --- INITIALISATION DE L'APPLICATION ET DES EXTENSIONS ---
app = Flask(__name__)
CORS(app, supports_credentials=True)
app.config['SECRET_KEY'] = 'une-cle-secrete-tres-difficile-a-deviner-et-a-changer'

login_manager = LoginManager()
login_manager.init_app(app)

# --- GESTION DE SESSION ---
@login_manager.user_loader
def load_user(user_id):
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE id = %s AND is_active = TRUE", (user_id,))
        user_data = cursor.fetchone()
        if user_data:
            return User(id=user_data['id'], username=user_data['username'], password_hash=user_data['password_hash'], role=user_data['role'])
        return None
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
from routes.standardisation import std_bp
from routes.drive import drive_bp
from routes.logs import logs_bp  
from routes.entities import entities_bp as api_entities_bp
from routes.referentiel import ref_bp 
from routes.niveaux import niveaux_bp


app.register_blueprint(auth_bp, url_prefix='/api/v1')
app.register_blueprint(users_bp, url_prefix='/api/v1/users')
app.register_blueprint(lists_bp, url_prefix='/api/v1/listes')
app.register_blueprint(manuels_bp, url_prefix='/api/v1/manuels')
app.register_blueprint(locations_bp, url_prefix='/api/v1/locations')
app.register_blueprint(dashboard_bp, url_prefix='/api/v1/dashboard')
app.register_blueprint(files_bp, url_prefix='/api/v1/processing')
app.register_blueprint(std_bp, url_prefix='/api/v1/standardisation')
app.register_blueprint(drive_bp, url_prefix='/api/v1/drive')
app.register_blueprint(logs_bp, url_prefix='/api/v1/logs') 
app.register_blueprint(api_entities_bp, url_prefix='/api/v1/entities')
app.register_blueprint(ref_bp, url_prefix='/api/v1/referentiel')
app.register_blueprint(niveaux_bp, url_prefix='/api/v1/niveaux')






if __name__ == '__main__':
    app.run(debug=True, port=5000)