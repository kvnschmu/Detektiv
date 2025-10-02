import os
import google.generativeai as genai
from flask import Flask, request, render_template
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
    # Vercel wird die App nicht bauen, wenn dieser Fehler auftritt
    raise ValueError("Kein GEMINI_API_KEY in der Umgebung gefunden.")

genai.configure(api_key=API_KEY)

# Initialisiere das Gemini-Modell
model = genai.GenerativeModel('gemini-1.5-flash')

# Erstelle die Flask-App wie gewohnt
app = Flask(__name__)

# Lade das HTML-Formular aus dem 'public' Verzeichnis
@app.route('/')
def index():
    logging.info('Frontend-Seite wurde aufgerufen.')
    return render_template('index.html')

# Verarbeite die Formular-Daten und rufe die Gemini API auf
@app.route('/api/generate-text', methods=['POST'])
def generate_text():
    tatort = request.form['tatort']
    tathandlung = request.form['tathandlung']
    zeugen = request.form['zeugen']
    beweismittel = request.form['beweismittel']

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
    except Exception as e:
        generated_text = f"Fehler bei der API-Anfrage: {e}"
        logging.error(f"Fehler bei der API-Anfrage: {e}")

    return f"""
    <!DOCTYPE html>
    <html lang="de">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ergebnis</title>
        <style>
            body {{ font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }}
            pre {{ background: #f4f4f4; padding: 20px; border-radius: 8px; white-space: pre-wrap; }}
            .disclaimer {{ margin-top: 30px; font-size: 0.9em; color: #888; }}
        </style>
    </head>
    <body>
        <h1>Generierter Sachverhaltstext</h1>
        <pre>{generated_text}</pre>
        <p class="disclaimer">Hinweis: Dieser Text wurde von einer KI erstellt und ist kein juristischer Rat.</p>
        <a href="/">Zurück zum Formular</a>
    </body>
    </html>
    """

# Vercel-spezifische Handler-Funktion
from vercel_python import VercelRequest, VercelResponse
from flask_cors import CORS
CORS(app) # Optional für CORS-Support

def handler(request: VercelRequest):
    return app(request.environ, request.start_response)

