import numpy as np
from fastapi import APIRouter, HTTPException
from sympy import diff, simplify, lambdify, symbols, limit, oo, integrate, sympify

from math_utils import parse_expression, to_latex
import schemas

router = APIRouter(prefix="/api/math", tags=["math"])


from sympy import solve, Eq

@router.post("/derivative", response_model=schemas.DerivativeResponse)
def derivative(req: schemas.DerivativeRequest):
    try:
        expr = parse_expression(req.expression)
        var = symbols(req.respect_to)
        result = diff(expr, var)
        result_simplified = simplify(result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Expresión inválida: {e}")

    steps = [
        schemas.DerivativeStep(description=f"Derivamos la expresión respecto a {req.respect_to}", expression=str(result)),
        schemas.DerivativeStep(description="Simplificamos el resultado", expression=str(result_simplified)),
    ]

    # Puntos críticos: donde la derivada se anula
    critical_points = []
    try:
        crit_solutions = solve(Eq(result_simplified, 0), var)
        for sol in crit_solutions:
            if sol.is_real:
                x_val = float(sol)
                y_val = float(expr.subs(var, sol))
                second_deriv = diff(result_simplified, var)
                second_val = float(second_deriv.subs(var, sol))
                if second_val > 0:
                    kind = "mínimo local"
                elif second_val < 0:
                    kind = "máximo local"
                else:
                    kind = "punto de inflexión (a confirmar)"
                critical_points.append(schemas.CriticalPoint(x=x_val, y=y_val, kind=kind))
    except Exception:
        pass  # si no se puede resolver simbólicamente, seguimos sin puntos críticos

    return schemas.DerivativeResponse(
        original=str(expr),
        original_latex=to_latex(expr),
        result=str(result),
        result_latex=to_latex(result),
        result_simplified=str(result_simplified),
        result_simplified_latex=to_latex(result_simplified),
        steps=steps,
        critical_points=critical_points,
    )


@router.post("/tangent-line", response_model=schemas.TangentLineResponse)
def tangent_line(req: schemas.TangentLineRequest):
    try:
        expr = parse_expression(req.expression)
        var = symbols("x")
        point_x = req.point_x

        y_val = float(expr.subs(var, point_x))
        deriv = diff(expr, var)
        slope = float(deriv.subs(var, point_x))

        # y - y0 = m(x - x0)  ->  y = m*x + (y0 - m*x0)
        intercept = y_val - slope * point_x
        tangent_expr_str = f"{slope}*x + {intercept}"

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular la tangente: {e}")

    return schemas.TangentLineResponse(
        point_x=point_x,
        point_y=round(y_val, 4),
        slope=round(slope, 4),
        tangent_expression=tangent_expr_str,
    )


@router.post("/plot", response_model=schemas.PlotResponse)
def plot(req: schemas.PlotRequest):
    try:
        expr = parse_expression(req.expression)
        free_syms = expr.free_symbols
        if len(free_syms) > 1:
            raise ValueError("La expresión debe tener una sola variable para graficar")
        var = list(free_syms)[0] if free_syms else symbols("x")
        f = lambdify(var, expr, modules=["numpy"])
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Expresión inválida: {e}")

    xs = np.linspace(req.x_min, req.x_max, req.num_points)
    with np.errstate(all="ignore"):
        ys = f(xs)
    if np.isscalar(ys):
        ys = np.full_like(xs, float(ys))
    ys = np.asarray(ys, dtype=float)

    points = [
        schemas.PlotPoint(x=float(x_val), y=float(y_val))
        for x_val, y_val in zip(xs, ys)
        if np.isfinite(y_val)
    ]

    domain_note = None
    if len(points) < len(xs):
        domain_note = "Algunos puntos quedaron fuera del dominio (ej: división por cero) y no se incluyen."

    return schemas.PlotResponse(expression=str(expr), points=points, domain_note=domain_note)


def _parse_point(point_str: str):
    if point_str.strip() in ("oo", "inf", "+oo", "infinito"):
        return oo
    if point_str.strip() in ("-oo", "-inf", "-infinito"):
        return -oo
    return sympify(point_str)


@router.post("/limit", response_model=schemas.LimitResponse)
def calculate_limit(req: schemas.LimitRequest):
    try:
        expr = parse_expression(req.expression)
        var = symbols(req.variable)
        point = _parse_point(req.point)

        dir_map = {"+": "+", "-": "-", "+-": "+-"}
        direction = dir_map.get(req.direction, "+-")

        if direction == "+-":
            left = limit(expr, var, point, dir="-")
            right = limit(expr, var, point, dir="+")
            exists = left == right
            result = left if exists else None
        else:
            result = limit(expr, var, point, dir=direction)
            exists = True

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular el límite: {e}")

    if result is None:
        result_str = "No existe (los límites laterales difieren)"
        result_lat = r"\text{No existe}"
    else:
        result_str = str(result)
        result_lat = to_latex(result)

    return schemas.LimitResponse(
        original=str(expr),
        original_latex=to_latex(expr),
        result=result_str,
        result_latex=result_lat,
        exists=exists,
    )


@router.post("/integral", response_model=schemas.IntegralResponse)
def calculate_integral(req: schemas.IntegralRequest):
    try:
        expr = parse_expression(req.expression)
        var = symbols(req.variable)

        is_definite = req.lower is not None and req.upper is not None
        if is_definite:
            lower = _parse_point(req.lower)
            upper = _parse_point(req.upper)
            result = integrate(expr, (var, lower, upper))
        else:
            result = integrate(expr, var)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo calcular la integral: {e}")

    return schemas.IntegralResponse(
        original=str(expr),
        original_latex=to_latex(expr),
        result=str(result),
        result_latex=to_latex(result),
        is_definite=is_definite,
    )