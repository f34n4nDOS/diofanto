from sympy import symbols
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)
from sympy import latex as sympy_latex
from sympy import solve, factor, simplify, expand, Poly, Symbol, fraction
from sympy import Eq
import json
import math
import random
import statistics
from collections import Counter
from sympy import Add, Mul, Rational, sin, cos, tan, exp, log, sqrt
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
    var = symbols(variable_str)

    if "=" not in equation_str:
        equation_str = f"{equation_str} = 0"

    left_str, right_str = equation_str.split("=")
    left = parse_expression(left_str.strip())
    right = parse_expression(right_str.strip())
    equation = expand(left - right)

    solutions = solve(equation, var)
    if not solutions:
        solutions = []

    steps = []
    is_quadratic = False

    try:
        poly = Poly(equation, var)
        degree = poly.degree()
    except Exception:
        degree = None

    if degree == 1:
        a, b = poly.all_coeffs()
        steps.append({"step": "Escribimos la ecuación en la forma a·x + b = 0", "expression": f"{to_latex(equation)} = 0"})
        steps.append({"step": f"Identificamos a = {a}, b = {b}", "expression": ""})
        if a != 0:
            steps.append({"step": "Despejamos x: x = -b / a", "expression": f"x = {to_latex(-b/a)}"})

    elif degree == 2:
        is_quadratic = True
        a, b, c = poly.all_coeffs()
        discriminant = b**2 - 4*a*c
        steps.append({"step": "Escribimos la ecuación en la forma a·x² + b·x + c = 0", "expression": f"{to_latex(equation)} = 0"})
        steps.append({"step": f"Identificamos a = {a}, b = {b}, c = {c}", "expression": ""})
        steps.append({"step": "Calculamos el discriminante: Δ = b² - 4ac", "expression": f"\\Delta = {to_latex(discriminant)}"})
        if discriminant > 0:
            steps.append({"step": "Δ > 0: hay dos soluciones reales distintas", "expression": ""})
        elif discriminant == 0:
            steps.append({"step": "Δ = 0: hay una única solución real (raíz doble)", "expression": ""})
        else:
            steps.append({"step": "Δ < 0: no hay soluciones reales (las raíces son complejas)", "expression": ""})
        steps.append({"step": "Aplicamos la fórmula cuadrática: x = (-b ± √Δ) / (2a)", "expression": ""})

    else:
        degree_label = degree if degree is not None else "no polinómica"
        steps.append({"step": f"Ecuación de grado {degree_label}, se resuelve de forma algebraica/simbólica", "expression": f"{to_latex(equation)} = 0"})

    return {
        "original": equation_str,
        "original_latex": to_latex(equation),
        "variable": variable_str,
        "solutions": [str(sol) for sol in solutions],
        "solutions_latex": [to_latex(sol) for sol in solutions],
        "is_quadratic": is_quadratic,
        "num_solutions": len(solutions),
        "steps": steps,
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
    expr = parse_expression(expr_str)
    var = symbols(variable_str)

    factored = factor(expr)

    if hasattr(factored, 'as_ordered_factors'):
        factors_list = factored.as_ordered_factors()
    else:
        factors_list = [factored]

    steps = []
    method = "factorización automática"

    if simplify(factored - expr) == 0 and len(factors_list) <= 1:
        method = "no se pudo factorizar más (expresión irreducible)"
        steps.append({"step": "No se encontraron factores comunes ni patrones reconocibles", "expression": to_latex(expr)})
    else:
        try:
            poly = Poly(expr, var)
            degree = poly.degree()
        except Exception:
            degree = None

        if degree == 2:
            coeffs = poly.all_coeffs()
            # completar con ceros si falta el término lineal o independiente
            while len(coeffs) < 3:
                coeffs.insert(1, 0)
            a, b, c = coeffs
            discriminant = b**2 - 4*a*c

            if b == 0:
                method = "diferencia de cuadrados"
                steps.append({"step": "Reconocemos la forma a² - b² = (a-b)(a+b)", "expression": to_latex(expr)})
                steps.append({"step": "Factorizamos", "expression": to_latex(factored)})
            elif discriminant == 0:
                method = "trinomio cuadrado perfecto"
                steps.append({"step": "El discriminante es 0: es un cuadrado perfecto", "expression": to_latex(expr)})
                steps.append({"step": "Factorizamos como (x ± r)²", "expression": to_latex(factored)})
            else:
                method = "trinomio factorizado por sus raíces"
                steps.append({"step": "Buscamos las raíces del polinomio cuadrático", "expression": to_latex(expr)})
                steps.append({"step": "Escribimos la factorización usando esas raíces", "expression": to_latex(factored)})
        else:
            # buscamos un factor común entre los términos
            from sympy import gcd as sympy_gcd
            try:
                terms = expr.as_ordered_terms()
                common = terms[0]
                for t in terms[1:]:
                    common = sympy_gcd(common, t)
                if len(terms) > 1 and common != 1:
                    method = "factor común"
                    steps.append({"step": f"Extraemos el factor común: {to_latex(common)}", "expression": to_latex(factored)})
                else:
                    steps.append({"step": "Aplicamos reglas generales de factorización", "expression": to_latex(factored)})
            except Exception:
                steps.append({"step": "Aplicamos reglas generales de factorización", "expression": to_latex(factored)})

    return {
        "original": expr_str,
        "original_latex": to_latex(expr),
        "factored": str(factored),
        "factored_latex": to_latex(factored),
        "factors": [str(f) for f in factors_list],
        "factors_latex": [to_latex(f) for f in factors_list],
        "method": method,
        "steps": steps,
    }


def simplify_expression(expr_str: str):
    expr = parse_expression(expr_str)
    simplified = simplify(expr)

    steps = [{"step": "Expresión original", "expression": to_latex(expr)}]

    try:
        numer, denom = fraction(expr)
        if denom != 1:
            f_numer = factor(numer)
            f_denom = factor(denom)
            steps.append({
                "step": "Factorizamos numerador y denominador",
                "expression": f"\\frac{{{to_latex(f_numer)}}}{{{to_latex(f_denom)}}}",
            })
            steps.append({"step": "Cancelamos los factores comunes", "expression": to_latex(simplified)})
        else:
            steps.append({"step": "Aplicamos simplificación algebraica", "expression": to_latex(simplified)})
    except Exception:
        steps.append({"step": "Aplicamos simplificación algebraica", "expression": to_latex(simplified)})

    return {
        "original": expr_str,
        "original_latex": to_latex(expr),
        "simplified": str(simplified),
        "simplified_latex": to_latex(simplified),
        "steps": steps,
    }


def expand_expression(expr_str: str, variable_str: str = "x"):
    expr = parse_expression(expr_str)
    expanded = expand(expr)

    steps = [
        {"step": "Expresión original", "expression": to_latex(expr)},
        {"step": "Aplicamos la propiedad distributiva", "expression": to_latex(expanded)},
    ]

    return {
        "original": expr_str,
        "original_latex": to_latex(expr),
        "expanded": str(expanded),
        "expanded_latex": to_latex(expanded),
        "steps": steps,
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
_BASIC_DERIVATIVES = {
    sin: "d/dx sin(x) = cos(x)",
    cos: "d/dx cos(x) = -sin(x)",
    tan: "d/dx tan(x) = sec²(x)",
    exp: "d/dx eˣ = eˣ",
    log: "d/dx ln(x) = 1/x",
}
# NOTA: sqrt se maneja aparte (más abajo, junto a la regla de la potencia) y
# NO va en este diccionario. sqrt(x) no es una clase de SymPy con instancias
# propias en el árbol de la expresión — es una función que construye
# Pow(x, 1/2). Si se usa como patrón en expr.find(sqrt), SymPy lo interpreta
# como un callable genérico y lo aplica a CADA subexpresión del árbol
# (llamando sqrt(subexpr) y evaluando el resultado como verdadero/falso),
# lo que "matchea" nodos que no son raíces en absoluto — incluyendo símbolos
# sueltos como x, que no tienen argumentos y rompen match.args[0].
 
 
def detect_derivative_rules(expr, var) -> list[str]:
    """
    Analiza la estructura de la expresión (antes de derivar) y devuelve
    una lista de reglas de derivación aplicables, en español, para
    mostrarle al estudiante qué se está usando y por qué.
    """
    if not expr.has(var):
        return ["La expresión no depende de la variable: su derivada es 0 (regla de la constante)."]
 
    rules: list[str] = []
 
    if isinstance(expr, Add):
        rules.append("Regla de la suma: derivamos cada término por separado y sumamos los resultados.")
 
    if isinstance(expr, Mul):
        non_const_factors = [a for a in expr.args if a.has(var)]
        if len(non_const_factors) >= 2:
            has_negative_power = any(
                getattr(f, "is_Pow", False) and f.args[1].is_negative for f in non_const_factors
            )
            if has_negative_power:
                rules.append("Regla del cociente: (u/v)' = (u'·v - u·v') / v².")
            else:
                rules.append("Regla del producto: (u·v)' = u'·v + u·v'.")
        elif len(non_const_factors) == 1:
            rules.append("Regla de la constante multiplicativa: (k·f)' = k·f'.")
 
    if getattr(expr, "is_Pow", False):
        base, exponent = expr.args
        if base == var and exponent == Rational(1, 2):
            rules.append("Regla de la raíz cuadrada: d/dx √x = 1/(2√x).")
        elif base == var and exponent.is_Number:
            rules.append(f"Regla de la potencia: d/dx x^{exponent} = {exponent}·x^{exponent - 1}.")
        elif base.has(var) and base != var:
            rules.append("Regla de la cadena: derivamos la función externa y la multiplicamos por la derivada de la interna.")
 
    for func_type, formula in _BASIC_DERIVATIVES.items():
        for match in expr.find(func_type):
            inner = match.args[0]
            if inner != var:
                rules.append(
                    f"Regla de la cadena sobre {func_type.__name__}({inner}): {formula}, "
                    f"multiplicado por la derivada de {inner}."
                )
            else:
                rules.append(formula)
 
    # quitar duplicados conservando el orden
    seen = set()
    unique_rules = []
    for r in rules:
        if r not in seen:
            seen.add(r)
            unique_rules.append(r)
    return unique_rules
 
 
# ==================== TEORÍA: INTEGRALES ====================
 
_BASIC_ANTIDERIVATIVES = {
    sin: "∫sin(x) dx = -cos(x) + C",
    cos: "∫cos(x) dx = sin(x) + C",
    exp: "∫eˣ dx = eˣ + C",
}
 
 
def detect_integral_rules(expr, var) -> list[str]:
    rules: list[str] = []
 
    if isinstance(expr, Add):
        rules.append("Regla de la suma: integramos cada término por separado y sumamos los resultados.")
 
    if isinstance(expr, Mul):
        non_const_factors = [a for a in expr.args if a.has(var)]
        const_factors = [a for a in expr.args if not a.has(var)]
        if const_factors and len(non_const_factors) <= 1:
            rules.append("Extraemos la constante fuera de la integral: ∫k·f(x) dx = k·∫f(x) dx.")
 
    if expr == var:
        rules.append("Regla de la potencia inversa: ∫x dx = x²/2 + C.")
    elif getattr(expr, "is_Pow", False):
        base, exponent = expr.args
        if base == var and exponent.is_Number and exponent != -1:
            rules.append(f"Regla de la potencia inversa: ∫x^{exponent} dx = x^{exponent + 1}/{exponent + 1} + C.")
        elif base == var and exponent == -1:
            rules.append("Caso especial: ∫(1/x) dx = ln|x| + C.")
 
    for func_type, formula in _BASIC_ANTIDERIVATIVES.items():
        if expr.has(func_type):
            rules.append(formula)
 
    seen = set()
    unique_rules = []
    for r in rules:
        if r not in seen:
            seen.add(r)
            unique_rules.append(r)
    return unique_rules
 
 
def build_integral_steps(expr, var, antiderivative, is_definite: bool, lower=None, upper=None) -> list[dict]:
    """
    Arma la lista de pasos explicativos para la integral, incluyendo la
    aplicación del Teorema Fundamental del Cálculo si es definida.
    """
    steps: list[dict] = []
 
    for rule in detect_integral_rules(expr, var):
        steps.append({"step": rule, "expression": ""})
 
    antideriv_label = to_latex(antiderivative) + ("" if is_definite else " + C")
    steps.append({"step": "Calculamos la antiderivada F(x)", "expression": antideriv_label})
 
    if is_definite and lower is not None and upper is not None:
        upper_val = antiderivative.subs(var, upper)
        lower_val = antiderivative.subs(var, lower)
        steps.append({
            "step": "Aplicamos el Teorema Fundamental del Cálculo: ∫ₐᵇ f(x) dx = F(b) - F(a)",
            "expression": f"F({to_latex(upper)}) - F({to_latex(lower)}) = {to_latex(upper_val)} - {to_latex(lower_val)}",
        })
 
    return steps