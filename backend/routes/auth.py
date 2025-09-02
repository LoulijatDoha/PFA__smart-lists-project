# Prototyping/routes/auth.py
from flask import Blueprint, jsonify, request
from flask_login import login_user, logout_user, login_required, current_user
import database
from models import User

# Créer le Blueprint pour les routes d'authentification
auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    db_conn = None
    try:
        db_conn = database.get_connection()
        cursor = db_conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users WHERE username = %s AND is_active = TRUE", (username,))
        user_data = cursor.fetchone()
        if user_data:
            user = User(id=user_data['id'], username=user_data['username'], password_hash=user_data['password_hash'], role=user_data['role'])
            if user.check_password(password):
                login_user(user, remember=True)
                return jsonify({"success": True, "message": "Connexion réussie.", "user": {"username": user.username, "role": user.role}})
        return jsonify({"success": False, "message": "Nom d'utilisateur ou mot de passe incorrect."}), 401
    finally:
        if db_conn and db_conn.is_connected():
            db_conn.close()

@auth_bp.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"success": True, "message": "Déconnexion réussie."})

@auth_bp.route('/status', methods=['GET'])
@login_required
def status():
    return jsonify({
        "is_logged_in": True,
        "user": {"id": current_user.id, "username": current_user.username, "role": current_user.role}
    })