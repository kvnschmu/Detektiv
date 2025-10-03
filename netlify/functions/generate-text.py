import os
import google.generativeai as genai
import json
from dotenv import load_dotenv
import logging

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    # Netlify-Funktionen verwenden einen anderen Rückgabetyp
    return {
        "statusCode": 500,
        "body": json.dumps({"error": "Kein GEMINI_API_KEY gefunden."})
    }

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def handler(event, context):
    try:
        # Daten aus dem Body der POST-Anfrage holen
        if event.get('body'):
            # Form-Daten werden oft als 'application/x-www-form-urlencoded' oder 'multipart/form-data' gesendet.
            # Ein einfaches Parsing kann hier notwendig sein.
            # Für diesen Fall gehen wir davon aus, dass die Daten als String gesendet werden.
            import urllib.parse
            data = urllib.parse.parse_qs(event['body'])
            tatort = data.get('tatort', [''])[0]
            tathandlung = data.get('tathandlung', [''])[0]
            zeugen = data.get('zeugen', [''])[0]
            beweismittel = data.get('beweismittel', [''])[0]
        else:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "Keine Daten in der Anfrage gefunden."})
            }

        prompt_text = f"""
        Prompt zur Erstellung eines juristischen Sachverhaltstextes
        Bitte fülle die folgenden Punkte mit den relevanten Informationen aus, um einen vollständigen und juristisch sicheren Sachverhaltstext zu erstellen. Antworte mit den reinen Fakten, die dir vorliegen.
        1. Tatzeit und -ort: {tatort}
        2. Tathandlung: {tathandlung}
        3. Zeugen und Festnahme: {zeugen}
        4. Beweismittel: {beweismittel}
        """
        logging.info("Neue Anfrage erhalten.")

        response = model.generate_content(prompt_text)
        generated_text = response.text
        logging.info("API-Anfrage erfolgreich.")
        
        return {
            "statusCode": 200,
            "body": json.dumps({"text": generated_text})
        }
    
    except Exception as e:
        logging.error(f"Fehler bei der API-Anfrage: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Fehler bei der API-Anfrage: {e}"})
        }
