from sympy import symbols
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)
from sympy import latex as sympy_latex
from sympy import solve, factor, simplify, expand, Poly, Symbol
from sympy import Eq
import json
import math
import random
import statistics
from collections import Counter
ALLOWED_VARS = "xyzt"


def parse_expression(expr_str: str):
    """
    Parsea un string como "x**2 + sin(x)" a una expresión de SymPy.
    Solo permite las variables x, y, z, t (más funciones estándar como
    sin, cos, exp, log, sqrt, que SymPy reconoce automáticamente).
    """
    transformations = standard_transformations + (implicit_multiplication_application,)
    local_dict = {name: symbols(name) for name in ALLOWED_VARS}

    try:
        expr = parse_expr(expr_str, local_dict=local_dict, transformations=transformations)
    except Exception as e:
        raise ValueError(f"No se pudo interpretar la expresión: {e}")

    return expr


def to_latex(expr) -> str:
    return sympy_latex(expr)


# ==================== ALGEBRA FUNCTIONS ====================

def solve_equation(equation_str: str, variable_str: str = "x"):
    """
    Resuelve una ecuación como "x**2 - 5*x + 6 = 0"
    
    Args:
        equation_str: ecuación como string (puede incluir o no el "= 0")
        variable_str: variable a despejar
    
    Returns:
        dict con soluciones y detalles
    """
    var = symbols(variable_str)
    
    # Si no tiene "=", asumimos que = 0
    if "=" not in equation_str:
        equation_str = f"{equation_str} = 0"
    
    # Parsear ecuación
    left_str, right_str = equation_str.split("=")
    left = parse_expression(left_str.strip())
    right = parse_expression(right_str.strip())
    
    # Crear ecuación como left - right = 0
    equation = left - right
    
    # Resolver
    solutions = solve(equation, var)
    
    if not solutions:
        solutions = []
    
    # Verificar si es cuadrática
    try:
        poly = Poly(equation, var)
        is_quadratic = poly.degree() == 2
    except:
        is_quadratic = False
    
    return {
        "original": equation_str,
        "original_latex": to_latex(equation),
        "variable": variable_str,
        "solutions": [str(sol) for sol in solutions],
        "solutions_latex": [to_latex(sol) for sol in solutions],
        "is_quadratic": is_quadratic,
        "num_solutions": len(solutions),
    }


def solve_system(equations: list[str], variables: list[str]):
    """
    Resuelve un sistema de ecuaciones lineales o no lineales
    
    Args:
        equations: lista de ecuaciones como strings
        variables: lista de variables a despejar
    
    Returns:
        dict con la solución
    """
    vars_dict = {var: symbols(var) for var in variables}
    
    # Parsear ecuaciones
    eq_list = []
    for eq_str in equations:
        if "=" not in eq_str:
            eq_str = f"{eq_str} = 0"
        
        left_str, right_str = eq_str.split("=")
        left = parse_expression(left_str.strip())
        right = parse_expression(right_str.strip())
        eq_list.append(Eq(left, right))
    
    # Resolver
    try:
        solution = solve(eq_list, [vars_dict[var] for var in variables])
        
        if isinstance(solution, list):
            # Múltiples soluciones
            solution_dict = {}
            if solution:
                for i, var in enumerate(variables):
                    solution_dict[var] = str(solution[0][i]) if isinstance(solution[0], tuple) else str(solution[0].get(vars_dict[var], "Sin solución"))
        else:
            # Una solución (diccionario)
            solution_dict = {var: str(solution.get(vars_dict[var], "Sin solución")) for var in variables}
        
        is_solvable = bool(solution_dict)
    except:
        solution_dict = {}
        is_solvable = False
    
    return {
        "equations": equations,
        "equations_latex": [to_latex(eq) for eq in eq_list],
        "variables": variables,
        "solution": solution_dict,
        "solution_latex": {k: to_latex(parse_expression(v)) if isinstance(v, str) else to_latex(v) 
                          for k, v in solution_dict.items()},
        "is_solvable": is_solvable,
    }


def factor_expression(expr_str: str, variable_str: str = "x"):
    """
    Factoriza una expresión
    
    Args:
        expr_str: expresión a factorizar
        variable_str: variable principal
    
    Returns:
        dict con factorización
    """
    expr = parse_expression(expr_str)
    var = symbols(variable_str)
    
    # Factorizar
    factored = factor(expr)
    
    # Obtener factores individuales
    if hasattr(factored, 'as_ordered_factors'):
        factors_list = factored.as_ordered_factors()
    else:
        factors_list = [factored]
    
    return {
        "original": expr_str,
        "original_latex": to_latex(expr),
        "factored": str(factored),
        "factored_latex": to_latex(factored),
        "factors": [str(f) for f in factors_list],
        "factors_latex": [to_latex(f) for f in factors_list],
    }


def simplify_expression(expr_str: str):
    """
    Simplifica una expresión algebraica
    
    Args:
        expr_str: expresión a simplificar
    
    Returns:
        dict con simplificación
    """
    expr = parse_expression(expr_str)
    
    # Simplificar
    simplified = simplify(expr)
    
    return {
        "original": expr_str,
        "original_latex": to_latex(expr),
        "simplified": str(simplified),
        "simplified_latex": to_latex(simplified),
        "steps": [
            {"step": "Expresión original", "expression": str(expr)},
            {"step": "Simplificación automática", "expression": str(simplified)},
        ],
    }


def expand_expression(expr_str: str, variable_str: str = "x"):
    """
    Expande una expresión (lo opuesto a factorizar)
    
    Args:
        expr_str: expresión a expandir
        variable_str: variable principal
    
    Returns:
        dict con expansión
    """
    expr = parse_expression(expr_str)
    var = symbols(variable_str)
    
    # Expandir
    expanded = expand(expr)
    
    return {
        "original": expr_str,
        "original_latex": to_latex(expr),
        "expanded": str(expanded),
        "expanded_latex": to_latex(expanded),
    }
def solve_triangle_sss(a: float, b: float, c: float) -> dict:
    sides = sorted([a, b, c])
    if sides[0] + sides[1] <= sides[2]:
        return {"valid": False}

    # Ley de cosenos para los tres ángulos (en grados)
    angle_a = math.degrees(math.acos((b**2 + c**2 - a**2) / (2 * b * c)))
    angle_b = math.degrees(math.acos((a**2 + c**2 - b**2) / (2 * a * c)))
    angle_c = 180 - angle_a - angle_b

    perimeter = a + b + c
    s = perimeter / 2
    area = math.sqrt(s * (s - a) * (s - b) * (s - c))

    if a == b == c:
        type_sides = "equilátero"
    elif a == b or b == c or a == c:
        type_sides = "isósceles"
    else:
        type_sides = "escaleno"

    angles = [angle_a, angle_b, angle_c]
    if any(abs(ang - 90) < 0.01 for ang in angles):
        type_angles = "rectángulo"
    elif any(ang > 90 for ang in angles):
        type_angles = "obtusángulo"
    else:
        type_angles = "acutángulo"

    return {
        "valid": True,
        "sides": [a, b, c],
        "angles": [round(angle_a, 2), round(angle_b, 2), round(angle_c, 2)],
        "perimeter": round(perimeter, 4),
        "area": round(area, 4),
        "type_sides": type_sides,
        "type_angles": type_angles,
    }


def circle_calculations(radius: float) -> dict:
    return {
        "radius": radius,
        "diameter": round(radius * 2, 4),
        "area": round(math.pi * radius**2, 4),
        "circumference": round(2 * math.pi * radius, 4),
    }


def regular_polygon_calculations(num_sides: int, side_length: float) -> dict:
    if num_sides < 3:
        raise ValueError("Un polígono necesita al menos 3 lados")

    perimeter = num_sides * side_length
    apothem = side_length / (2 * math.tan(math.pi / num_sides))
    area = (perimeter * apothem) / 2
    interior_angle = ((num_sides - 2) * 180) / num_sides
    exterior_angle = 360 / num_sides

    return {
        "num_sides": num_sides,
        "side_length": side_length,
        "perimeter": round(perimeter, 4),
        "area": round(area, 4),
        "interior_angle": round(interior_angle, 4),
        "exterior_angle": round(exterior_angle, 4),
    }

def descriptive_stats(data: list[float]) -> dict:
    if len(data) == 0:
        raise ValueError("La lista de datos no puede estar vacía")

    mean = statistics.mean(data)
    median = statistics.median(data)

    try:
        mode = statistics.mode(data)
    except statistics.StatisticsError:
        mode = None  # no hay una moda única

    variance = statistics.variance(data) if len(data) > 1 else 0
    std_dev = statistics.stdev(data) if len(data) > 1 else 0

    counter = Counter(data)
    frequency_table = [{"value": k, "absolute": v, "relative": round(v / len(data), 4)} for k, v in sorted(counter.items())]

    return {
        "count": len(data),
        "mean": round(mean, 4),
        "median": round(median, 4),
        "mode": mode,
        "variance": round(variance, 4),
        "std_dev": round(std_dev, 4),
        "min_value": min(data),
        "max_value": max(data),
        "frequency_table": frequency_table,
    }


def simulate_coin_flips(num_flips: int) -> dict:
    if num_flips < 1 or num_flips > 100000:
        raise ValueError("La cantidad de lanzamientos debe estar entre 1 y 100000")

    results = [random.choice(["cara", "ceca"]) for _ in range(num_flips)]

    heads_count = 0
    convergence = []
    step = max(1, num_flips // 100)  # ~100 puntos para el gráfico, sin importar cuántos lanzamientos sean
    for i, r in enumerate(results, start=1):
        if r == "cara":
            heads_count += 1
        if i % step == 0 or i == num_flips:
            convergence.append({"trial": i, "relative_frequency": round(heads_count / i, 4)})

    tails_count = num_flips - heads_count
    return {
        "num_flips": num_flips,
        "heads_count": heads_count,
        "tails_count": tails_count,
        "heads_relative_frequency": round(heads_count / num_flips, 4),
        "theoretical_probability": 0.5,
        "convergence": convergence,
    }


def simulate_dice_rolls(num_rolls: int, num_sides: int = 6) -> dict:
    if num_rolls < 1 or num_rolls > 100000:
        raise ValueError("La cantidad de tiradas debe estar entre 1 y 100000")
    if num_sides < 2:
        raise ValueError("El dado debe tener al menos 2 caras")

    results = [random.randint(1, num_sides) for _ in range(num_rolls)]
    counter = Counter(results)

    frequency_table = [
        {
            "value": face,
            "absolute": counter.get(face, 0),
            "relative": round(counter.get(face, 0) / num_rolls, 4),
            "theoretical": round(1 / num_sides, 4),
        }
        for face in range(1, num_sides + 1)
    ]

    return {
        "num_rolls": num_rolls,
        "num_sides": num_sides,
        "frequency_table": frequency_table,
        "mean_result": round(statistics.mean(results), 4),
    }