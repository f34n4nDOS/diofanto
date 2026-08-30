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