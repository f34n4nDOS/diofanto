from database import SessionLocal
import models

db = SessionLocal()

exercises_data = [
    # ==================== ALGEBRA ====================
    {
        "area": "algebra", "topic": "ecuaciones lineales", "level": "terciario", "difficulty": "easy",
        "statement": "Resolvé: 3x - 7 = 8",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.001, "explanation": "3x = 15, entonces x = 5"},
    },
    {
        "area": "algebra", "topic": "ecuaciones lineales", "level": "terciario", "difficulty": "easy",
        "statement": "Resolvé: 5x + 2 = 17",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "5x = 15, entonces x = 3"},
    },
    {
        "area": "algebra", "topic": "ecuaciones cuadraticas", "level": "terciario", "difficulty": "medium",
        "statement": "x² - 7x + 10 = 0. ¿Cuál es la mayor de las raíces?",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.001, "explanation": "(x-2)(x-5)=0, las raíces son 2 y 5"},
    },
    {
        "area": "algebra", "topic": "factorizacion", "level": "terciario", "difficulty": "medium",
        "statement": "x² - 9 factorizado es...",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "b",
            "options": {"a": "(x-3)(x-3)", "b": "(x-3)(x+3)", "c": "(x+9)(x-1)", "d": "no se puede factorizar"},
            "explanation": "Es diferencia de cuadrados: x² - 9 = (x-3)(x+3)",
        },
    },
    {
        "area": "algebra", "topic": "sistemas de ecuaciones", "level": "terciario", "difficulty": "medium",
        "statement": "Sistema: x + y = 10, x - y = 2. ¿Cuánto vale x?",
        "exercise_type": "numeric",
        "answer_data": {"value": 6.0, "tolerance": 0.001, "explanation": "Sumando ambas ecuaciones: 2x = 12, x = 6"},
    },
    {
        "area": "algebra", "topic": "ecuaciones cuadraticas", "level": "terciario", "difficulty": "hard",
        "statement": "x² + 2x - 15 = 0. ¿Cuál es la menor de las raíces?",
        "exercise_type": "numeric",
        "answer_data": {"value": -5.0, "tolerance": 0.001, "explanation": "(x-3)(x+5)=0, las raíces son 3 y -5"},
    },
    {
        "area": "algebra", "topic": "simplificacion", "level": "terciario", "difficulty": "easy",
        "statement": "Simplificá: (x² - 4)/(x - 2)",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "b",
            "options": {"a": "x - 2", "b": "x + 2", "c": "x² - 2", "d": "2x"},
            "explanation": "x² - 4 = (x-2)(x+2), simplificando queda x + 2",
        },
    },

    # ==================== GEOMETRIA ====================
    {
        "area": "geometria", "topic": "triangulos", "level": "terciario", "difficulty": "easy",
        "statement": "Un triángulo rectángulo tiene catetos de 6 y 8. ¿Cuánto mide la hipotenusa?",
        "exercise_type": "numeric",
        "answer_data": {"value": 10.0, "tolerance": 0.01, "explanation": "Teorema de Pitágoras: √(6²+8²) = √100 = 10"},
    },
    {
        "area": "geometria", "topic": "circunferencia", "level": "terciario", "difficulty": "easy",
        "statement": "¿Cuál es el área de una circunferencia de radio 3? (redondeá a 2 decimales)",
        "exercise_type": "numeric",
        "answer_data": {"value": 28.27, "tolerance": 0.05, "explanation": "Área = π·r² = π·9 ≈ 28.27"},
    },
    {
        "area": "geometria", "topic": "poligonos regulares", "level": "terciario", "difficulty": "medium",
        "statement": "¿Cuál es el perímetro de un hexágono regular de lado 5?",
        "exercise_type": "numeric",
        "answer_data": {"value": 30.0, "tolerance": 0.01, "explanation": "Perímetro = 6 lados × 5 = 30"},
    },
    {
        "area": "geometria", "topic": "areas", "level": "terciario", "difficulty": "easy",
        "statement": "¿Cuál es el área de un rectángulo de base 6 y altura 4?",
        "exercise_type": "numeric",
        "answer_data": {"value": 24.0, "tolerance": 0.01, "explanation": "Área = base × altura = 6 × 4 = 24"},
    },
    {
        "area": "geometria", "topic": "triangulos", "level": "terciario", "difficulty": "medium",
        "statement": "¿Cuál es el área de un triángulo equilátero de lado 6? (redondeá a 2 decimales)",
        "exercise_type": "numeric",
        "answer_data": {"value": 15.59, "tolerance": 0.05, "explanation": "Área = (√3/4)·lado² = (√3/4)·36 ≈ 15.59"},
    },
    {
        "area": "geometria", "topic": "poligonos regulares", "level": "terciario", "difficulty": "hard",
        "statement": "¿Cuánto mide cada ángulo interior de un octógono regular?",
        "exercise_type": "numeric",
        "answer_data": {"value": 135.0, "tolerance": 0.01, "explanation": "((n-2)·180)/n = (6·180)/8 = 135°"},
    },
    {
        "area": "geometria", "topic": "triangulos", "level": "terciario", "difficulty": "easy",
        "statement": "Un triángulo tiene lados 5, 5 y 8. ¿Cómo se clasifica según sus lados?",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "b",
            "options": {"a": "equilátero", "b": "isósceles", "c": "escaleno", "d": "rectángulo"},
            "explanation": "Tiene dos lados iguales (5 y 5), por lo tanto es isósceles",
        },
    },

    # ==================== FUNCIONES ====================
    {
        "area": "funciones", "topic": "evaluacion de funciones", "level": "terciario", "difficulty": "easy",
        "statement": "f(x) = 2x + 3. ¿Cuánto vale f(4)?",
        "exercise_type": "numeric",
        "answer_data": {"value": 11.0, "tolerance": 0.001, "explanation": "f(4) = 2·4 + 3 = 11"},
    },
    {
        "area": "funciones", "topic": "raices", "level": "terciario", "difficulty": "easy",
        "statement": "f(x) = x² - 1. ¿Cuál es su raíz positiva?",
        "exercise_type": "numeric",
        "answer_data": {"value": 1.0, "tolerance": 0.001, "explanation": "x² - 1 = 0 → x = ±1, la positiva es 1"},
    },
    {
        "area": "funciones", "topic": "dominio", "level": "universitario", "difficulty": "medium",
        "statement": "f(x) = 1/(x-3). ¿Qué valor de x NO pertenece al dominio?",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "El denominador se anula en x=3, división por cero"},
    },
    {
        "area": "funciones", "topic": "paridad", "level": "universitario", "difficulty": "medium",
        "statement": "f(x) = x². ¿Es una función par o impar?",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "a",
            "options": {"a": "par", "b": "impar", "c": "ninguna de las dos"},
            "explanation": "f(-x) = (-x)² = x² = f(x), cumple la definición de función par",
        },
    },
    {
        "area": "funciones", "topic": "limites de funciones", "level": "universitario", "difficulty": "hard",
        "statement": "f(x) = (x²-1)/(x-1). ¿Cuál es el límite cuando x→1?",
        "exercise_type": "numeric",
        "answer_data": {"value": 2.0, "tolerance": 0.001, "explanation": "Simplificando: (x-1)(x+1)/(x-1) = x+1, en x=1 da 2"},
    },
    {
        "area": "funciones", "topic": "evaluacion de funciones", "level": "terciario", "difficulty": "easy",
        "statement": "f(x) = 3x. ¿Cuánto vale f(-2)?",
        "exercise_type": "numeric",
        "answer_data": {"value": -6.0, "tolerance": 0.001, "explanation": "f(-2) = 3·(-2) = -6"},
    },

    # ==================== LIMITES ====================
    {
        "area": "calculo", "topic": "limites", "level": "universitario", "difficulty": "easy",
        "statement": "Calculá: lim x→2 de (x+3)",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.001, "explanation": "Es una función continua, se evalúa directo: 2+3=5"},
    },
    {
        "area": "calculo", "topic": "limites", "level": "universitario", "difficulty": "medium",
        "statement": "Calculá: lim x→0 de sin(x)/x",
        "exercise_type": "numeric",
        "answer_data": {"value": 1.0, "tolerance": 0.001, "explanation": "Es el límite notable clásico, vale 1"},
    },
    {
        "area": "calculo", "topic": "limites", "level": "universitario", "difficulty": "medium",
        "statement": "Calculá: lim x→3 de (x²-9)/(x-3)",
        "exercise_type": "numeric",
        "answer_data": {"value": 6.0, "tolerance": 0.001, "explanation": "Factorizando: (x-3)(x+3)/(x-3) = x+3, en x=3 da 6"},
    },
    {
        "area": "calculo", "topic": "limites al infinito", "level": "universitario", "difficulty": "hard",
        "statement": "Calculá: lim x→∞ de (3x+1)/x",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "Dividiendo por x: 3 + 1/x, cuando x→∞ el segundo término se anula"},
    },
    {
        "area": "calculo", "topic": "limites", "level": "universitario", "difficulty": "easy",
        "statement": "¿Cuál es el límite de la función constante f(x)=5 cuando x→0?",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "b",
            "options": {"a": "0", "b": "5", "c": "no existe", "d": "infinito"},
            "explanation": "El límite de una función constante es la constante misma",
        },
    },
    {
        "area": "calculo", "topic": "limites", "level": "universitario", "difficulty": "hard",
        "statement": "Calculá: lim x→1 de (x³-1)/(x-1)",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "Factorizando: (x-1)(x²+x+1)/(x-1) = x²+x+1, en x=1 da 3"},
    },

    # ==================== DERIVADAS ====================
    {
        "area": "calculo", "topic": "derivadas", "level": "universitario", "difficulty": "easy",
        "statement": "¿Cuál es la derivada de x² en x=3?",
        "exercise_type": "numeric",
        "answer_data": {"value": 6.0, "tolerance": 0.001, "explanation": "f'(x)=2x, f'(3)=6"},
    },
    {
        "area": "calculo", "topic": "derivadas", "level": "universitario", "difficulty": "easy",
        "statement": "¿Cuál es la derivada de 3x + 5?",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "La derivada de una función lineal es su pendiente, 3"},
    },
    {
        "area": "calculo", "topic": "derivadas", "level": "universitario", "difficulty": "medium",
        "statement": "¿Cuál es la derivada de x³ en x=1?",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "f'(x)=3x², f'(1)=3"},
    },
    {
        "area": "calculo", "topic": "derivadas", "level": "universitario", "difficulty": "medium",
        "statement": "¿Cuál es la derivada de sin(x) en x=0?",
        "exercise_type": "numeric",
        "answer_data": {"value": 1.0, "tolerance": 0.001, "explanation": "f'(x)=cos(x), cos(0)=1"},
    },
    {
        "area": "calculo", "topic": "puntos criticos", "level": "universitario", "difficulty": "hard",
        "statement": "¿En qué valor de x está el punto crítico (vértice) de x² - 4x + 3?",
        "exercise_type": "numeric",
        "answer_data": {"value": 2.0, "tolerance": 0.001, "explanation": "f'(x)=2x-4=0 → x=2"},
    },
    {
        "area": "calculo", "topic": "derivadas", "level": "universitario", "difficulty": "hard",
        "statement": "¿Cuál es la derivada de ln(x) en x=1?",
        "exercise_type": "numeric",
        "answer_data": {"value": 1.0, "tolerance": 0.001, "explanation": "f'(x)=1/x, f'(1)=1"},
    },

    # ==================== INTEGRALES ====================
    {
        "area": "calculo", "topic": "integrales definidas", "level": "universitario", "difficulty": "easy",
        "statement": "Calculá la integral definida de x dx entre 0 y 4",
        "exercise_type": "numeric",
        "answer_data": {"value": 8.0, "tolerance": 0.001, "explanation": "∫x dx = x²/2, evaluado entre 0 y 4: 16/2 = 8"},
    },
    {
        "area": "calculo", "topic": "integrales definidas", "level": "universitario", "difficulty": "easy",
        "statement": "Calculá la integral definida de 2x dx entre 0 y 3",
        "exercise_type": "numeric",
        "answer_data": {"value": 9.0, "tolerance": 0.001, "explanation": "∫2x dx = x², evaluado entre 0 y 3: 9"},
    },
    {
        "area": "calculo", "topic": "integrales definidas", "level": "universitario", "difficulty": "medium",
        "statement": "Calculá la integral definida de x² dx entre 0 y 3",
        "exercise_type": "numeric",
        "answer_data": {"value": 9.0, "tolerance": 0.001, "explanation": "∫x² dx = x³/3, evaluado entre 0 y 3: 27/3 = 9"},
    },
    {
        "area": "calculo", "topic": "integrales definidas", "level": "universitario", "difficulty": "medium",
        "statement": "Calculá la integral definida de 1 dx entre 2 y 5",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "Es el área de un rectángulo de altura 1 y ancho 3"},
    },
    {
        "area": "calculo", "topic": "integrales definidas", "level": "universitario", "difficulty": "hard",
        "statement": "Calculá la integral definida de x² dx entre 1 y 3 (redondeá a 2 decimales)",
        "exercise_type": "numeric",
        "answer_data": {"value": 8.67, "tolerance": 0.05, "explanation": "∫x² dx = x³/3, evaluado: 27/3 - 1/3 = 26/3 ≈ 8.67"},
    },
    {
        "area": "calculo", "topic": "integrales indefinidas", "level": "universitario", "difficulty": "easy",
        "statement": "La integral indefinida de 2x dx es...",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "a",
            "options": {"a": "x² + C", "b": "2x² + C", "c": "x + C", "d": "x²/2 + C"},
            "explanation": "∫2x dx = x² + C",
        },
    },

    # ==================== ESTADISTICA ====================
    {
        "area": "estadistica", "topic": "medidas de tendencia central", "level": "terciario", "difficulty": "easy",
        "statement": "¿Cuál es la media de los datos: 2, 4, 6, 8, 10?",
        "exercise_type": "numeric",
        "answer_data": {"value": 6.0, "tolerance": 0.001, "explanation": "(2+4+6+8+10)/5 = 30/5 = 6"},
    },
    {
        "area": "estadistica", "topic": "medidas de tendencia central", "level": "terciario", "difficulty": "easy",
        "statement": "¿Cuál es la mediana de los datos: 3, 7, 9, 2, 5?",
        "exercise_type": "numeric",
        "answer_data": {"value": 5.0, "tolerance": 0.001, "explanation": "Ordenados: 2,3,5,7,9. El valor central es 5"},
    },
    {
        "area": "estadistica", "topic": "medidas de tendencia central", "level": "terciario", "difficulty": "medium",
        "statement": "¿Cuál es la moda de los datos: 2, 3, 3, 5, 3, 7?",
        "exercise_type": "numeric",
        "answer_data": {"value": 3.0, "tolerance": 0.001, "explanation": "El valor 3 aparece 3 veces, más que cualquier otro"},
    },
    {
        "area": "estadistica", "topic": "medidas de dispersion", "level": "terciario", "difficulty": "medium",
        "statement": "¿Cuál es el rango (máximo - mínimo) de los datos: 4, 9, 2, 15, 7?",
        "exercise_type": "numeric",
        "answer_data": {"value": 13.0, "tolerance": 0.001, "explanation": "Máximo=15, mínimo=2, rango=15-2=13"},
    },
    {
        "area": "estadistica", "topic": "medidas de dispersion", "level": "universitario", "difficulty": "hard",
        "statement": "¿Cuál es la varianza poblacional de los datos: 2, 4, 4, 4, 5, 5, 7, 9?",
        "exercise_type": "numeric",
        "answer_data": {"value": 4.0, "tolerance": 0.01, "explanation": "Media=5, la varianza poblacional de este conjunto es 4"},
    },
    {
        "area": "estadistica", "topic": "probabilidad", "level": "terciario", "difficulty": "easy",
        "statement": "¿Cuál es la probabilidad de obtener cara al lanzar una moneda justa?",
        "exercise_type": "multiple_choice",
        "answer_data": {
            "correct_option": "c",
            "options": {"a": "0", "b": "0.25", "c": "0.5", "d": "1"},
            "explanation": "Una moneda justa tiene 2 resultados igualmente probables, cada uno con probabilidad 0.5",
        },
    },
]

for data in exercises_data:
    exercise = models.Exercise(**data)
    db.add(exercise)

db.commit()
print(f"Se cargaron {len(exercises_data)} ejercicios nuevos")
db.close()