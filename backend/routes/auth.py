# Prototyping/routes/auth.py
from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_login import login_user, logout_user, login_required, current_user
from datetime import datetime
import database
from models import User # Importe la classe User corrigée

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({"success": False, "message": "Nom d'utilisateur et mot de passe requis."}), 400

    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s AND is_active = TRUE", (username,))
        user_dict = cursor.fetchone()

        if not user_dict or not check_password_hash(user_dict['password_hash'], password):
            return jsonify({"success": False, "message": "Identifiants invalides."}), 401

        # Cette ligne ne causera plus d'erreur
        user = User(
            id=user_dict['id'],
            username=user_dict['username'],
            role=user_dict['role'],
            must_change_password=user_dict.get('must_change_password', False)
        )
        
        login_user(user)

        cursor.execute("UPDATE users SET last_login = %s WHERE id = %s", (datetime.utcnow(), user.id))
        db_conn.commit()

        user_data = {
            'id': user.id,
            'username': user.username,
            'role': user.role,
            'must_change_password': user.must_change_password
        }
        return jsonify({"success": True, "message": "Connexion réussie.", "user": user_data})

    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

# ... (les routes /logout et /status restent les mêmes)

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Déconnexion réussie."})

@auth_bp.route('/status')
def get_status():
    if current_user.is_authenticated:
        user_data = {
            'id': current_user.id,
            'username': current_user.username,
            'role': current_user.role,
            'must_change_password': getattr(current_user, 'must_change_password', False)
        }
        return jsonify({"is_logged_in": True, "user": user_data})
    else:
        return jsonify({"is_logged_in": False})