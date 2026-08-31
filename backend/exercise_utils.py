from sympy import simplify, sympify


def check_answer(exercise_type: str, submitted_answer, answer_data: dict) -> bool:
    """
    answer_data trae la respuesta correcta en distinta forma según exercise_type:
    - 'numeric': {"value": 4.0, "tolerance": 0.01}
    - 'multiple_choice': {"correct_option": "b"}
    - 'equation': {"value": "3", "variable": "x"}  (una o más soluciones, separadas por coma si son varias)
    - 'expression': {"value": "2*x + 1"}  (se compara simbólicamente, no como texto)
    """
    try:
        if exercise_type == "numeric":
            expected = float(answer_data["value"])
            tolerance = float(answer_data.get("tolerance", 0.001))
            return abs(float(submitted_answer) - expected) <= tolerance

        elif exercise_type == "multiple_choice":
            return str(submitted_answer).strip().lower() == str(answer_data["correct_option"]).strip().lower()

        elif exercise_type in ("equation", "expression"):
            # Comparación simbólica: transforma ambos a expresiones de SymPy y verifica que
            # la diferencia se simplifique a 0, así "2x+2" y "2*(x+1)" cuentan como iguales.
            expected_expr = sympify(answer_data["value"])
            submitted_expr = sympify(str(submitted_answer))
            return simplify(expected_expr - submitted_expr) == 0

        else:
            # tipo desconocido: comparación de texto simple como fallback
            return str(submitted_answer).strip() == str(answer_data.get("value", "")).strip()

    except Exception:
        return False  # cualquier respuesta mal formada se considera incorrecta, no error 500