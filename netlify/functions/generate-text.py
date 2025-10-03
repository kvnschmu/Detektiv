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
    return {
        "statusCode": 500,
        "body": "Kein GEMINI_API_KEY gefunden."
    }

genai.configure(api_key=API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

def handler(event, context):
    try:
        # Die Daten kommen bei Netlify-Functions in event.queryStringParameters
        data = event.get('queryStringParameters', {})
        tatort = data.get('tatort', '')
        tathandlung = data.get('tathandlung', '')
        zeugen = data.get('zeugen', '')
        beweismittel = data.get('beweismittel', '')

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
