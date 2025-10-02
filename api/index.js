import os
import google.generativeai as genai
from flask import Flask, request, send_from_directory, jsonify
from dotenv import load_dotenv
import logging

# Lade Umgebungsvariablen aus der .env-Datei, falls lokal getestet wird
load_dotenv()

# Konfiguriere das Logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

# Hole den API-Schlüssel aus der Umgebungsvariable
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    logging.error("Kein GEMINI_API_KEY in der Umgebung gefunden.")
    raise ValueError("Kein GEMINI_API_KEY in der Umgebung gefunden.")

genai.configure(api_key=API_KEY)

# Initialisiere das Gemini-Modell
model = genai.GenerativeModel('gemini-1.5-flash')

# Erstelle die Flask-App
app = Flask(__name__)

# Route, um die HTML-Datei auszuliefern
@app.route('/')
def serve_index():
    logging.info('Frontend-Seite wurde aufgerufen.')
    return send_from_directory('public', 'index.html')

# API-Endpunkt für die Formularverarbeitung
@app.route('/api/generate-text', methods=['POST'])
def generate_text():
    # .get() verwenden, um Abstürze bei fehlenden Feldern zu verhindern
    tatort = request.form.get('tatort')
    tathandlung = request.form.get('tathandlung')
    zeugen = request.form.get('zeugen')
    beweismittel = request.form.get('beweismittel')

    prompt_text = f"""
    Prompt zur Erstellung eines juristischen Sachverhaltstextes
    Bitte fülle die folgenden Punkte mit den relevanten Informationen aus, um einen vollständigen und juristisch sicheren Sachverhaltstext zu erstellen. Antworte mit den reinen Fakten, die dir vorliegen.
    1. Tatzeit und -ort: {tatort}
    2. Tathandlung: {tathandlung}
    3. Zeugen und Festnahme: {zeugen}
    4. Beweismittel: {beweismittel}
    """
    logging.info(f"Neue Anfrage erhalten.")

    try:
        response = model.generate_content(prompt_text)
        generated_text = response.text
        logging.info("API-Anfrage erfolgreich.")
        # Gib eine JSON-Antwort zurück, wie der Frontend-Code erwartet
        return jsonify({"text": generated_text})
    except Exception as e:
        logging.error(f"Fehler bei der API-Anfrage: {e}")
        # Gib bei einem Fehler eine JSON-Antwort mit einer Fehlermeldung zurück
        return jsonify({"error": f"Fehler bei der API-Anfrage: {e}"}), 500

# Dies ist notwendig, damit Vercel Flask korrekt erkennt.
from vercel_python import VercelRequest, VercelResponse
from flask_cors import CORS
CORS(app)

def handler(request: VercelRequest):
    return app(request.environ, request.start_response)
