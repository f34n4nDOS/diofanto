"""
Script de seed: carga ejercicios de ejemplo en las 4 áreas.

Uso (parado en la carpeta backend/, con el venv activado):
    python seed_exercises.py

Es seguro correrlo más de una vez: si ya existen ejercicios, no duplica
(chequea por el texto del enunciado antes de insertar).
"""
from database import SessionLocal
import models

EXERCISES = [
    # ==================== ÁLGEBRA ====================
    {
        "area": "algebra",
        "topic": "ecuaciones lineales",
        "level": "terciario",
        "difficulty": "easy",
        "statement": "Resolvé: 2x + 3 = 11",
        "exercise_type": "numeric",
        "answer_data": {"value": 4.0, "tolerance": 0.01, "explanation": "2x = 8 → x = 4"},
    },
    {
        "area": "algebra",
        "topic": "ecuaciones cuadráticas",
        "level": "terciario",
        "difficulty": "medium",
        "statement": "¿Cuál es una de las soluciones de x^2 - 5x + 6 = 0?",
        "exercise_type": "numeric",
        "answer_data": {"value": 2.0, "tolerance": 0.01, "explanation": "(x-2)(x-3)=0 → x=2 o x=3"},
    },
    {
        "area": "algebra",
        "topic": "factorización",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Factorizá la expresión: x^2 - 5*x + 6",
        "exercise_type": "expression",
        "answer_data": {"value": "(x-2)*(x-3)", "explanation": "Buscamos dos números que sumen -5 y multipliquen 6: -2 y -3."},
    },
    {
        "area": "algebra",
        "topic": "conceptos básicos",
        "level": "terciario",
        "difficulty": "easy",
        "statement": "¿Cuál es el grado del polinomio 3x^4 - 2x + 1?",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "b",
            "options": {"a": "2", "b": "4", "c": "3", "d": "1"},
            "explanation": "El grado es el mayor exponente de la variable: 4.",
        },
    },

    # ==================== GEOMETRÍA ====================
    {
        "area": "geometry",
        "topic": "triángulos",
        "level": "terciario",
        "difficulty": "easy",
        "statement": "Un triángulo rectángulo tiene catetos de 3 y 4. ¿Cuánto mide la hipotenusa?",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.01, "explanation": "Teorema de Pitágoras: √(3²+4²) = 5"},
    },
    {
        "area": "geometry",
        "topic": "circunferencia",
        "level": "terciario",
        "difficulty": "easy",
        "statement": "¿Cuál es el área de un círculo de radio 2? (usá π ≈ 3.1416, redondeá a 2 decimales)",
        "exercise_type": "numeric",
        "answer_data": {"value": 12.57, "tolerance": 0.05, "explanation": "A = π*r² = π*4 ≈ 12.57"},
    },
    {
        "area": "geometry",
        "topic": "polígonos",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "¿Cuántos grados mide cada ángulo interior de un hexágono regular?",
        "exercise_type": "numeric",
        "answer_data": {"value": 120.0, "tolerance": 0.01, "explanation": "((6-2)*180)/6 = 120°"},
    },

    # ==================== CÁLCULO — DERIVADAS ====================
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Derivá f(x) = x^3 respecto a x",
        "exercise_type": "expression",
        "answer_data": {"value": "3*x**2", "explanation": "Regla de la potencia: d/dx x^n = n*x^(n-1)"},
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Si f(x) = 5*x, ¿cuánto vale f'(x) para cualquier valor de x?",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.01, "explanation": "La derivada de una función lineal a*x es la constante a."},
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Derivá f(x) = x^2 + 3*x respecto a x",
        "exercise_type": "expression",
        "answer_data": {"value": "2*x + 3", "explanation": "Derivamos término a término: d/dx x² = 2x, d/dx 3x = 3."},
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Derivá f(x) = sin(x) respecto a x",
        "exercise_type": "expression",
        "answer_data": {"value": "cos(x)", "explanation": "La derivada de sin(x) es cos(x)."},
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Calculá f'(2) si f(x) = x^3 - 4*x",
        "exercise_type": "numeric",
        "answer_data": {"value": 8.0, "tolerance": 0.01, "explanation": "f'(x) = 3x² - 4. En x=2: 3(4) - 4 = 8."},
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Derivá f(x) = x^2 * exp(x) respecto a x (regla del producto)",
        "exercise_type": "expression",
        "answer_data": {
            "value": "2*x*exp(x) + x**2*exp(x)",
            "explanation": "Regla del producto: (u*v)' = u'v + uv', con u=x², v=exp(x).",
        },
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "¿Cuál es la derivada de f(x) = log(x)? (log natural)",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "a",
            "options": {"a": "1/x", "b": "x", "c": "log(x)", "d": "exp(x)"},
            "explanation": "La derivada de ln(x) es 1/x.",
        },
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "hard",
        "statement": "Derivá f(x) = sin(x)*cos(x) respecto a x",
        "exercise_type": "expression",
        "answer_data": {
            "value": "cos(x)**2 - sin(x)**2",
            "explanation": "Regla del producto, o equivalente a cos(2x) usando identidades trigonométricas.",
        },
    },
    {
        "area": "calculus",
        "topic": "derivadas",
        "level": "universitario",
        "difficulty": "hard",
        "statement": "¿En qué valor positivo de x la función f(x) = x^3 - 3*x tiene un punto crítico?",
        "exercise_type": "numeric",
        "answer_data": {"value": 1.0, "tolerance": 0.01, "explanation": "f'(x) = 3x² - 3 = 0 → x = ±1. El positivo es x=1."},
    },

    # ==================== CÁLCULO — LÍMITES ====================
    {
        "area": "calculus",
        "topic": "límites",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Calculá: límite de sin(x)/x cuando x tiende a 0",
        "exercise_type": "numeric",
        "answer_data": {"value": 1.0, "tolerance": 0.01, "explanation": "Es un límite notable: vale 1."},
    },

    # ==================== CÁLCULO — INTEGRALES ====================
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Calculá la integral indefinida de 2*x respecto a x (sin agregar la constante C)",
        "exercise_type": "expression",
        "answer_data": {"value": "x**2", "explanation": "∫2x dx = x² + C"},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Calculá la integral indefinida de 3*x^2 respecto a x (sin la constante C)",
        "exercise_type": "expression",
        "answer_data": {"value": "x**3", "explanation": "Regla inversa de la potencia: ∫x^n dx = x^(n+1)/(n+1)."},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "easy",
        "statement": "Calculá la integral indefinida de cos(x) respecto a x (sin la constante C)",
        "exercise_type": "expression",
        "answer_data": {"value": "sin(x)", "explanation": "∫cos(x) dx = sin(x) + C"},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Calculá la integral definida de x entre 0 y 4",
        "exercise_type": "numeric",
        "answer_data": {"value": 8.0, "tolerance": 0.01, "explanation": "∫x dx = x²/2. Evaluado entre 0 y 4: 16/2 - 0 = 8."},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Calculá la integral definida de 2*x entre 1 y 3",
        "exercise_type": "numeric",
        "answer_data": {"value": 8.0, "tolerance": 0.01, "explanation": "∫2x dx = x². Evaluado entre 1 y 3: 9 - 1 = 8."},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "Calculá la integral indefinida de 1/x respecto a x (sin la constante C)",
        "exercise_type": "expression",
        "answer_data": {"value": "log(x)", "explanation": "∫(1/x) dx = ln(x) + C (SymPy escribe el logaritmo natural como log)."},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "¿Cuál es la integral indefinida de sin(x)? (sin la constante C)",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "a",
            "options": {"a": "-cos(x)", "b": "cos(x)", "c": "-sin(x)", "d": "sin(x)"},
            "explanation": "∫sin(x) dx = -cos(x) + C",
        },
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "hard",
        "statement": "Calculá el área bajo la curva f(x) = x^2 entre x=0 y x=3",
        "exercise_type": "numeric",
        "answer_data": {"value": 9.0, "tolerance": 0.01, "explanation": "∫x² dx = x³/3. Evaluado entre 0 y 3: 27/3 - 0 = 9."},
    },
    {
        "area": "calculus",
        "topic": "integrales",
        "level": "universitario",
        "difficulty": "hard",
        "statement": "Calculá la integral indefinida de 2*exp(x) respecto a x (sin la constante C)",
        "exercise_type": "expression",
        "answer_data": {"value": "2*exp(x)", "explanation": "∫exp(x) dx = exp(x) + C, multiplicado por la constante 2."},
    },

    # ==================== ESTADÍSTICA ====================
    {
        "area": "statistics",
        "topic": "estadística descriptiva",
        "level": "terciario",
        "difficulty": "easy",
        "statement": "¿Cuál es la media de los datos: 2, 4, 6, 8?",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.01, "explanation": "(2+4+6+8)/4 = 5"},
    },
    {
        "area": "statistics",
        "topic": "probabilidad",
        "level": "terciario",
        "difficulty": "easy",
        "statement": "Al tirar un dado justo de 6 caras, ¿cuál es la probabilidad de sacar un número par? (como decimal)",
        "exercise_type": "numeric",
        "answer_data": {"value": 0.5, "tolerance": 0.01, "explanation": "3 de 6 caras son pares: 3/6 = 0.5"},
    },
    {
        "area": "statistics",
        "topic": "conceptos básicos",
        "level": "universitario",
        "difficulty": "medium",
        "statement": "¿Cuál de estas medidas es más sensible a valores extremos (outliers)?",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "a",
            "options": {"a": "Media", "b": "Mediana", "c": "Moda", "d": "Ninguna"},
            "explanation": "La media se ve afectada por valores extremos; la mediana y la moda son más robustas.",
        },
    },
]


def run_seed():
    db = SessionLocal()
    try:
        inserted = 0
        skipped = 0
        for ex in EXERCISES:
            exists = (
                db.query(models.Exercise)
                .filter(models.Exercise.statement == ex["statement"])
                .first()
            )
            if exists:
                skipped += 1
                continue

            db.add(models.Exercise(**ex))
            inserted += 1

        db.commit()
        print(f"Listo. Insertados: {inserted}, ya existían (saltados): {skipped}")
    finally:
        db.close()


if __name__ == "__main__":
    run_seed()