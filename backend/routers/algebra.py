from fastapi import APIRouter, HTTPException, Depends
from schemas import (
    EquationRequest,
    EquationResponse,
    SystemRequest,
    SystemResponse,
    FactorRequest,
    FactorResponse,
    SimplifyRequest,
    SimplifyResponse,
    ExpandRequest,
    ExpandResponse,
)
from math_utils import (
    solve_equation,
    solve_system,
    factor_expression,
    simplify_expression,
    expand_expression,
)
from dependencies import get_current_user

router = APIRouter(prefix="/algebra", tags=["algebra"])


@router.post("/solve-equation", response_model=EquationResponse)
async def solve_equation_endpoint(request: EquationRequest, user=Depends(get_current_user)):
    """
    Resuelve una ecuación lineal o no lineal
    
    Ejemplos:
    - "x**2 - 5*x + 6 = 0"
    - "2*x + 3 = 7"
    - "x**3 - 1 = 0"
    """
    try:
        result = solve_equation(request.equation, request.variable)
        return EquationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al resolver: {str(e)}")


@router.post("/solve-system", response_model=SystemResponse)
async def solve_system_endpoint(request: SystemRequest, user=Depends(get_current_user)):
    """
    Resuelve un sistema de ecuaciones lineales o no lineales
    
    Ejemplo:
    - equations: ["x + y = 5", "2*x - y = 1"]
    - variables: ["x", "y"]
    """
    try:
        if len(request.equations) != len(request.variables):
            raise ValueError("El número de ecuaciones debe coincidir con el de variables")
        
        result = solve_system(request.equations, request.variables)
        return SystemResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al resolver sistema: {str(e)}")


@router.post("/factor", response_model=FactorResponse)
async def factor_endpoint(request: FactorRequest, user=Depends(get_current_user)):
    """
    Factoriza una expresión algebraica
    
    Ejemplos:
    - "x**2 - 5*x + 6"
    - "x**3 - 1"
    - "x**4 - 1"
    """
    try:
        result = factor_expression(request.expression, request.variable)
        return FactorResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al factorizar: {str(e)}")


@router.post("/simplify", response_model=SimplifyResponse)
async def simplify_endpoint(request: SimplifyRequest, user=Depends(get_current_user)):
    """
    Simplifica una expresión algebraica
    
    Ejemplos:
    - "(x**2 - 1)/(x - 1)"
    - "x**2 + 2*x + 1"
    - "sin(x)**2 + cos(x)**2"
    """
    try:
        result = simplify_expression(request.expression)
        return SimplifyResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al simplificar: {str(e)}")


@router.post("/expand", response_model=ExpandResponse)
async def expand_endpoint(request: ExpandRequest, user=Depends(get_current_user)):
    """
    Expande una expresión algebraica (lo opuesto a factorizar)
    
    Ejemplos:
    - "(x + 1)**2"
    - "(x - 1)**3"
    - "(x + y)*(x - y)"
    """
    try:
        result = expand_expression(request.expression, request.variable)
        return ExpandResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al expandir: {str(e)}")
