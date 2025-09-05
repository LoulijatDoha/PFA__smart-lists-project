@echo off

REM --- C'EST LA LIGNE CORRIGÉE ---
REM Elle pointe maintenant vers le Python de votre environnement virtuel
SET PYTHON_EXE="E:\S8\PFA\smart-list-projet\backend\venv\Scripts\python.exe"

REM --- Le reste est bon ---
SET SCRIPT_PATH="E:\S8\PFA\smart-list-projet\backend\main.py"
SET LOG_FILE="E:\S8\PFA\smart-list-projet\backend\logs\task.log"

echo Lancement du script le %date% à %time%... >> %LOG_FILE%

REM On n'a plus besoin de "call activate.bat" car on appelle directement le bon python
%PYTHON_EXE% %SCRIPT_PATH% >> %LOG_FILE% 2>&1