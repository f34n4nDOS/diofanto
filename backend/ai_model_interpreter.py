"""
Interpreta una consigna en texto libre y sugiere cuál de los modelos
predefinidos usar, con condiciones iniciales y parámetros razonables.

Usa una LISTA de modelos de OpenRouter con fallback automático: si el
primero falla (sin crédito, rate limit, error del proveedor, etc.), prueba
con el siguiente. También cachea respuestas por consigna para no volver a
gastar crédito si alguien manda el mismo texto dos veces.
"""
import os
import json
import hashlib
import logging
import requests
from dotenv import load_dotenv

from ode_solver import get_model_description, get_model_equations, get_default_parameters

load_dotenv()

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

# Lista de modelos a probar en orden. Se puede sobreescribir con la variable
# de entorno OPENROUTER_MODELS separando los ids por comas, por ejemplo:
#   OPENROUTER_MODELS=openrouter/free,anthropic/claude-3.5-haiku
#
# "openrouter/free" es el auto-router gratuito de OpenRouter: en vez de
# fijar un modelo gratuito puntual (cuyo id cambia o se discontinúa cada
# pocas semanas), le pedimos a OpenRouter que elija él mismo cuál modelo
# gratuito está disponible ahora. Si por algún motivo eso también falla,
# cae al modelo de pago como red de seguridad final.
DEFAULT_MODELS = [
    "openrouter/free",
    "anthropic/claude-3.5-haiku",
]

_raw_models_env = os.getenv("OPENROUTER_MODELS", "")
OPENROUTER_MODELS = (
    [m.strip() for m in _raw_models_env.split(",") if m.strip()]
    if _raw_models_env
    else DEFAULT_MODELS
)

# Errores de OpenRouter que justifican pasar al siguiente modelo de la lista
# en vez de abortar todo: sin crédito (402), modelo no encontrado (404),
# rate limit (429), o el proveedor del modelo caído del lado de OpenRouter (5xx).
RETRYABLE_STATUS_CODES = {402, 404, 429, 500, 502, 503, 504}

REQUEST_TIMEOUT_SECONDS = 30

# Caché simple en memoria del proceso: mismo texto de consigna -> misma
# respuesta, sin volver a pegarle a la API. Se pierde al reiniciar el
# servidor; si necesitás que persista entre reinicios, se puede cambiar
# por una tabla en la base de datos sin tocar el resto de la lógica.
_response_cache: dict[str, dict] = {}


# Variables de cada modelo, en el mismo orden que espera odeint (S,I,R / x,y / etc.)
MODEL_VARIABLES = {
    "covid19": ["S", "I", "R"],
    "predator_prey": ["Presas", "Depredadores"],
    "rossiter": ["S", "I", "R"],
    "climate": ["Temperatura", "CO2"],
    "tuberculosis": ["S", "E", "I", "R"],
    "competition": ["Especie 1", "Especie 2"],
    "sir_simple": ["S", "I", "R"],
    "pendulum": ["Ángulo (θ)", "Velocidad angular (ω)"],
    "solow": ["Capital (K)"],
    "lorenz": ["x", "y", "z"],
}

ALLOWED_MODEL_IDS = list(MODEL_VARIABLES.keys())


def _build_catalog_text() -> str:
    """Arma una descripción de los 10 modelos para incluir en el prompt."""
    lines = []
    for model_id in ALLOWED_MODEL_IDS:
        variables = MODEL_VARIABLES[model_id]
        description = get_model_description(model_id)
        equations = get_model_equations(model_id)
        defaults = get_default_parameters(model_id)
        lines.append(
            f"- id: \"{model_id}\"\n"
            f"  descripción: {description}\n"
            f"  variables (en este orden): {variables}\n"
            f"  ecuaciones: {equations}\n"
            f"  parámetros por defecto: {defaults}"
        )
    return "\n".join(lines)


def _build_system_prompt() -> str:
    catalog_text = _build_catalog_text()
    return f"""Sos un asistente que ayuda a estudiantes a elegir y configurar un modelo matemático (sistema de ecuaciones diferenciales) a partir de una situación descrita en lenguaje natural.

Tenés disponibles estos 10 modelos predefinidos:

{catalog_text}

Tu tarea: leer la consigna del estudiante y responder ÚNICAMENTE con un JSON válido (sin texto adicional, sin markdown, sin backticks) con esta forma exacta:

{{
  "model_type": "uno de los ids de arriba",
  "initial_conditions": [lista de números, en el mismo orden que las variables del modelo elegido],
  "parameters": {{"nombre_parametro": valor, ...}} (usando los mismos nombres de parámetros del modelo elegido, ajustados según la consigna cuando sea posible),
  "time_periods": número (cuántas unidades de tiempo simular, elegí algo razonable para ver la dinámica completa),
  "justification": "explicación breve en español de por qué elegiste ese modelo y esos valores, pensada para que el estudiante entienda la relación entre la consigna y el modelo"
}}

Reglas importantes:
- "model_type" TIENE que ser exactamente uno de los ids listados arriba.
- "initial_conditions" tiene que tener EXACTAMENTE la misma cantidad de valores que variables tiene el modelo elegido.
- Los valores numéricos que menciona la consigna (población, tasas, etc.) tienen que reflejarse en initial_conditions o parameters cuando corresponda.
- Si la consigna no da un dato numérico necesario, usá un valor por defecto razonable y decilo en la justificación.
"""


def _extract_json(raw_content: str) -> dict:
    """Limpia el envoltorio de markdown que a veces agregan los modelos y parsea el JSON."""
    content = raw_content.strip()
    if content.startswith("```"):
        content = content.strip("`")
        if content.startswith("json"):
            content = content[4:]
        content = content.strip()

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"La IA no devolvió un JSON válido: {e}. Respuesta cruda: {content[:300]}")


def _call_model(model_id: str, system_prompt: str, scenario_text: str) -> str:
    """
    Hace un único intento contra un modelo puntual de OpenRouter.
    Devuelve el contenido crudo de la respuesta, o levanta una excepción
    (incluyendo el status code cuando aplica, para que el llamador decida
    si vale la pena reintentar con otro modelo).
    """
    response = requests.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": model_id,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": scenario_text},
            ],
            "temperature": 0.3,
        },
        timeout=REQUEST_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    data = response.json()
    return data["choices"][0]["message"]["content"]


def _cache_key(scenario_text: str) -> str:
    return hashlib.sha256(scenario_text.strip().lower().encode("utf-8")).hexdigest()


def interpret_scenario(scenario_text: str, use_cache: bool = True) -> dict:
    """
    Envía la consigna a OpenRouter y devuelve un dict con:
    model_type, initial_conditions, parameters, time_periods, justification

    Prueba los modelos de OPENROUTER_MODELS en orden: si uno falla por
    falta de crédito, rate limit, o error del proveedor, pasa al
    siguiente automáticamente en vez de romper. Si TODOS fallan, levanta
    el último error para que quede claro qué pasó.
    """
    if not OPENROUTER_API_KEY:
        raise ValueError("Falta configurar OPENROUTER_API_KEY en el archivo .env")

    if not OPENROUTER_MODELS:
        raise ValueError("No hay modelos configurados en OPENROUTER_MODELS")

    cache_key = _cache_key(scenario_text)
    if use_cache and cache_key in _response_cache:
        logger.info("interpret_scenario: respuesta servida desde caché, sin consumir crédito")
        return _response_cache[cache_key]

    system_prompt = _build_system_prompt()

    parsed = None
    last_error = None

    for model_id in OPENROUTER_MODELS:
        try:
            raw_content = _call_model(model_id, system_prompt, scenario_text)
        except requests.exceptions.HTTPError as e:
            status = e.response.status_code if e.response is not None else None
            if status in RETRYABLE_STATUS_CODES:
                logger.warning(
                    "interpret_scenario: modelo %s falló (status %s), probando siguiente si hay",
                    model_id, status,
                )
                last_error = e
                continue
            # Error no recuperable (ej: 400 por payload inválido) -> no
            # tiene sentido probar otro modelo, se corta acá.
            raise
        except requests.exceptions.RequestException as e:
            # timeouts, errores de conexión, etc. — también vale la pena
            # probar el siguiente modelo antes de darse por vencido.
            logger.warning("interpret_scenario: modelo %s falló (%s), probando siguiente si hay", model_id, e)
            last_error = e
            continue

        try:
            parsed = _extract_json(raw_content)
            logger.info("interpret_scenario: respuesta obtenida y parseada con el modelo %s", model_id)
            break
        except ValueError as e:
            # El modelo respondió pero no devolvió JSON válido (pasa más
            # seguido con modelos gratuitos más chicos) -> probamos el
            # siguiente de la lista en vez de fallar directo.
            logger.warning(
                "interpret_scenario: modelo %s devolvió JSON inválido, probando siguiente si hay",
                model_id,
            )
            last_error = e
            continue

    if parsed is None:
        raise ValueError(
            f"Ningún modelo de la lista pudo responder con un JSON válido. Último error: {last_error}"
        )

    model_type = parsed.get("model_type")
    if model_type not in ALLOWED_MODEL_IDS:
        raise ValueError(f"La IA sugirió un modelo no reconocido: {model_type}")

    expected_var_count = len(MODEL_VARIABLES[model_type])
    initial_conditions = parsed.get("initial_conditions", [])
    if len(initial_conditions) != expected_var_count:
        raise ValueError(
            f"El modelo '{model_type}' espera {expected_var_count} condiciones iniciales, "
            f"pero la IA devolvió {len(initial_conditions)}"
        )

    result = {
        "model_type": model_type,
        "model_variables": MODEL_VARIABLES[model_type],
        "initial_conditions": [float(v) for v in initial_conditions],
        "parameters": {k: float(v) for k, v in parsed.get("parameters", {}).items()},
        "time_periods": float(parsed.get("time_periods", 50)),
        "justification": parsed.get("justification", ""),
    }

    if use_cache:
        _response_cache[cache_key] = result

    return result