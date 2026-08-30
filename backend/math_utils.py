from sympy import symbols
from sympy.parsing.sympy_parser import (
    parse_expr,
    standard_transformations,
    implicit_multiplication_application,
)
from sympy import latex as sympy_latex

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