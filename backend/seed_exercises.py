from database import SessionLocal
import models

db = SessionLocal()

exercises_data = [
    {
        "area": "algebra", "topic": "ecuaciones lineales", "level": "terciario", "difficulty": "easy",
        "statement": "Resolvé: 2x + 3 = 11",
        "exercise_type": "numeric",
        "answer_data": {"value": 4.0, "tolerance": 0.001, "explanation": "2x = 11 - 3 = 8, entonces x = 4"},
    },
    {
        "area": "algebra", "topic": "ecuaciones cuadraticas", "level": "terciario", "difficulty": "medium",
        "statement": "¿Cuál es una de las raíces de x² - 5x + 6 = 0? (dá la mayor)",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "(x-2)(x-3)=0, las raíces son 2 y 3"},
    },
    {
        "area": "calculo", "topic": "derivadas", "level": "universitario", "difficulty": "easy",
        "statement": "¿Cuál es la derivada de x³ en x=2? (valor numérico)",
        "exercise_type": "numeric",
        "answer_data": {"value": 12.0, "tolerance": 0.001, "explanation": "f'(x) = 3x², f'(2) = 3*4 = 12"},
    },
    {
        "area": "geometria", "topic": "triangulos", "level": "terciario", "difficulty": "easy",
        "statement": "Un triángulo tiene lados 3, 4 y 5. ¿Cuál es su área?",
        "exercise_type": "numeric",
        "answer_data": {"value": 6.0, "tolerance": 0.01, "explanation": "Es un triángulo rectángulo, área = (3*4)/2 = 6"},
    },
    {
        "area": "algebra", "topic": "factorizacion", "level": "terciario", "difficulty": "medium",
        "statement": "¿Cuál es el valor de una de las opciones? x² - 4 factorizado es...",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "b",
            "options": {"a": "(x-2)(x-2)", "b": "(x-2)(x+2)", "c": "(x+4)(x-1)", "d": "no se puede factorizar"},
            "explanation": "Es una diferencia de cuadrados: x² - 4 = (x-2)(x+2)",
        },
    },
]

for data in exercises_data:
    exercise = models.Exercise(**data)
    db.add(exercise)

db.commit()
print(f"Se cargaron {len(exercises_data)} ejercicios")
db.close()