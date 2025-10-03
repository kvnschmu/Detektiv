import os
import google.generativeai as genai
from flask import Flask, request, send_from_directory, jsonify
from dotenv import load_dotenv

# Lade Umgebungsvariablen aus der .env-Datei, falls lokal getestet wird
load_dotenv()

# Hole den API-Schlüssel aus der Umgebungsvariable
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    # Gib einen klaren Fehler zurück, falls der Schlüssel fehlt
    raise ValueError("Kein GEMINI_API_KEY in der Umgebung gefunden.")

genai.configure(api_key=API_KEY)

# Initialisiere das Gemini-Modell
model = genai.GenerativeModel('gemini-1.5-flash')

# Erstelle die Flask-App
app = Flask(__name__)

# Route, um die HTML-Datei auszuliefern
@app.route('/')
def serve_index():
    return send_from_directory('public', 'index.html')

# API-Endpunkt für die Formularverarbeitung
@app.route('/api/generate-text', methods=['POST'])
def generate_text():
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
    try:
        response = model.generate_content(prompt_text)
        generated_text = response.text
        return jsonify({"text": generated_text})
    except Exception as e:
        return jsonify({"error": f"Fehler bei der API-Anfrage: {e}"}), 500
