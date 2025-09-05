# Prototyping/routes/profile.py

from flask import Blueprint, jsonify, request
from flask_login import login_required, current_user
from werkzeug.security import generate_password_hash
import database

# Création du Blueprint pour les routes liées au profil de l'utilisateur connecté
profile_bp = Blueprint('profile_bp', __name__)

@profile_bp.route('/change-password', methods=['POST'])
@login_required # Seul un utilisateur connecté peut accéder à cette route
def change_password():
    """
    Permet à l'utilisateur actuellement authentifié de changer son propre mot de passe.
    """
    data = request.json
    new_password = data.get('password')

    # Validation simple du mot de passe
    if not new_password or len(new_password) < 8:
        return jsonify({"message": "Le mot de passe doit contenir au moins 8 caractères."}), 400

    # Hachage du nouveau mot de passe pour le stocker de manière sécurisée
    password_hash = generate_password_hash(new_password)
    
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor()
        
        # Mise à jour du mot de passe dans la base de données ET
        # désactivation du flag qui force le changement de mot de passe.
        cursor.execute(
            "UPDATE users SET password_hash = %s, must_change_password = FALSE WHERE id = %s", 
            (password_hash, current_user.id)
        )
        db_conn.commit()
        
        return jsonify({"message": "Votre mot de passe a été mis à jour avec succès."})

    except Exception as e:
        if db_conn:
            db_conn.rollback()
        # Loggez l'erreur pour le débogage
        print(f"Erreur lors du changement de mot de passe pour user_id {current_user.id}: {e}")
        return jsonify({"message": "Une erreur interne est survenue."}), 500
        
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()