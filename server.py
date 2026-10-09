import json
import os
import re
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import quote, urlsplit
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent
MAX_BODY_BYTES = 64 * 1024
MAX_MESSAGE_LENGTH = 4000
SYSTEM_INSTRUCTION = (
    "Eres un asistente de orientación general de salud para comunidades de Ecuador. "
    "Responde en español, de forma clara y breve. No diagnostiques, no prescribas "
    "medicamentos ni dosis, y no afirmes que sustituyes a un profesional de salud. "
    "Si faltan datos, haz preguntas concretas. Ante dificultad para respirar, dolor "
    "fuerte en el pecho, pérdida del conocimiento, convulsiones, sangrado abundante "
    "o empeoramiento rápido, indica llamar al ECU 911 sin esperar más respuestas. "
    "No inventes protocolos ni datos médicos; señala la incertidumbre."
)


class GeminiHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self):
        if urlsplit(self.path).path == "/api/health":
            self.send_json(200, {"configured": bool(os.environ.get("GEMINI_API_KEY"))})
            return
        super().do_GET()

    def do_POST(self):
        if urlsplit(self.path).path != "/api/chat":
            self.send_json(404, {"error": "Ruta no encontrada."})
            return

        api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        if not api_key:
            self.send_json(503, {"error": "El servidor no tiene GEMINI_API_KEY configurada."})
            return

        try:
            body_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            self.send_json(400, {"error": "Solicitud inválida."})
            return

        if body_length <= 0 or body_length > MAX_BODY_BYTES:
            self.send_json(413, {"error": "La conversación está vacía o supera el límite permitido."})
            return

        try:
            payload = json.loads(self.rfile.read(body_length))
            messages = self.prepare_messages(payload)
        except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as error:
            self.send_json(400, {"error": str(error) or "Solicitud inválida."})
            return

        model = os.environ.get("GEMINI_MODEL", "gemini-3.8-flash").strip()
        if not re.fullmatch(r"[A-Za-z0-9._-]+", model):
            self.send_json(500, {"error": "GEMINI_MODEL tiene un formato inválido."})
            return

        request_body = {
            "systemInstruction": {"parts": [{"text": SYSTEM_INSTRUCTION}]},
            "contents": messages,
            "generationConfig": {"temperature": 0.3, "maxOutputTokens": 700},
        }
        endpoint = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{quote(model, safe='')}:generateContent"
        )
        request = Request(
            endpoint,
            data=json.dumps(request_body).encode("utf-8"),
            headers={"Content-Type": "application/json", "x-goog-api-key": api_key},
            method="POST",
        )

        try:
            with urlopen(request, timeout=30) as response:
                gemini_response = json.loads(response.read())
        except HTTPError as error:
            print(f"Gemini devolvió HTTP {error.code}.")
            self.send_json(502, {"error": "Gemini no pudo procesar la consulta."})
            return
        except (URLError, TimeoutError, OSError):
            self.send_json(502, {"error": "No se pudo conectar con Gemini."})
            return
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(502, {"error": "Gemini devolvió una respuesta inválida."})
            return

        candidates = gemini_response.get("candidates", [])
        parts = candidates[0].get("content", {}).get("parts", []) if candidates else []
        reply = "\n".join(
            part["text"].strip()
            for part in parts
            if isinstance(part, dict) and isinstance(part.get("text"), str) and part["text"].strip()
        )
        if not reply:
            self.send_json(502, {"error": "Gemini no generó una respuesta de texto."})
            return

        self.send_json(200, {"reply": reply})

    @staticmethod
    def prepare_messages(payload):
        if not isinstance(payload, dict) or not isinstance(payload.get("messages"), list):
            raise ValueError("Falta la pregunta del usuario.")
        if len(payload["messages"]) != 1:
            raise ValueError("Por privacidad, Gemini recibe una sola pregunta y no el historial.")

        message = payload["messages"][0]
        if not isinstance(message, dict) or message.get("role") != "user" or not isinstance(message.get("text"), str):
            raise ValueError("Solo se acepta una pregunta del usuario.")

        text = message["text"].strip()
        if not text:
            raise ValueError("La pregunta está vacía.")
        if len(text) > MAX_MESSAGE_LENGTH:
            raise ValueError("La pregunta debe tener menos de 4000 caracteres.")
        if has_sensitive_identifiers(text):
            raise ValueError("Quita cédulas, teléfonos y correos antes de consultar Gemini.")

        return [{"role": "user", "parts": [{"text": text}]}]

    def send_json(self, status, payload):
        response_body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(response_body)))
        self.end_headers()
        self.wfile.write(response_body)


def has_sensitive_identifiers(text):
    normalized_phone = re.sub(r"[\s()-]", "", text)
    return bool(
        re.search(r"[\w.+-]+@[\w.-]+\.[A-Z]{2,}", text, re.IGNORECASE)
        or re.search(r"\d{10,}", normalized_phone)
        or re.search(r"(?:\+?593)?09\d{8}\b", normalized_phone)
    )


if __name__ == "__main__":
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", "8000"))
    with ThreadingHTTPServer((host, port), GeminiHandler) as server:
        print(f"Gaia Medica disponible en http://{host}:{port}")
        print("Gemini configurado." if os.environ.get("GEMINI_API_KEY") else "Gemini sin configurar; el chat usará respuestas locales.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor detenido.")