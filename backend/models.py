# Prototyping/models.py
from flask_login import UserMixin

class User(UserMixin):
    """
    Classe utilisateur pour la gestion de session par Flask-Login.
    Elle ne contient PAS d'informations sensibles comme le mot de passe hashé.
    """
    def __init__(self, id, username, role, must_change_password=False):
        self.id = id
        self.username = username
        self.role = role
        self.must_change_password = must_change_password

    def __repr__(self):
        return f"<User id={self.id} username='{self.username}' role='{self.role}'>"

    # La méthode get_id est déjà gérée par UserMixin, mais la définir explicitement ne fait pas de mal.
    def get_id(self):
        return str(self.id)