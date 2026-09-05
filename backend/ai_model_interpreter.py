"""
Interpreta una consigna en texto libre y sugiere cuál de los modelos
predefinidos usar, con condiciones iniciales y parámetros razonables.
"""
import os
import json
import requests
from dotenv import load_dotenv

from ode_solver import get_model_description, get_model_equations, get_default_parameters

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")
OPENROUTER_MODEL = os.getenv("OPENROUTER_MODEL", "anthropic/claude-3.5-haiku")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"



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


def interpret_scenario(scenario_text: str) -> dict:
    """
    Envía la consigna a OpenRouter y devuelve un dict con:
    model_type, initial_conditions, parameters, time_periods, justification
    """
    if not OPENROUTER_API_KEY:
        raise ValueError("Falta configurar OPENROUTER_API_KEY en el archivo .env")

    catalog_text = _build_catalog_text()

    system_prompt = f"""Sos un asistente que ayuda a estudiantes a elegir y configurar un modelo matemático (sistema de ecuaciones diferenciales) a partir de una situación descrita en lenguaje natural.

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

    response = requests.post(
        OPENROUTER_URL,
        headers={
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
        },
        json={
            "model": OPENROUTER_MODEL,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": scenario_text},
            ],
            "temperature": 0.3,
        },
        timeout=30,
    )
    response.raise_for_status()
    data = response.json()

    raw_content = data["choices"][0]["message"]["content"].strip()

    # Por si el modelo igual envuelve la respuesta en ```json ... ```
    if raw_content.startswith("```"):
        raw_content = raw_content.strip("`")
        if raw_content.startswith("json"):
            raw_content = raw_content[4:]
        raw_content = raw_content.strip()

    try:
        parsed = json.loads(raw_content)
    except json.JSONDecodeError as e:
        raise ValueError(f"La IA no devolvió un JSON válido: {e}. Respuesta cruda: {raw_content[:300]}")

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

    return {
        "model_type": model_type,
        "model_variables": MODEL_VARIABLES[model_type],
        "initial_conditions": [float(v) for v in initial_conditions],
        "parameters": {k: float(v) for k, v in parsed.get("parameters", {}).items()},
        "time_periods": float(parsed.get("time_periods", 50)),
        "justification": parsed.get("justification", ""),
    }