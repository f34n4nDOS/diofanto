from pydantic import BaseModel, EmailStr
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    role: str
    created_at: datetime

    class Config:
        from_attributes = True  # permite crear esto directo desde un objeto SQLAlchemy

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class DerivativeRequest(BaseModel):
    expression: str
    respect_to: str = "x"


class DerivativeStep(BaseModel):
    description: str
    expression: str


class DerivativeResponse(BaseModel):
    original: str
    original_latex: str
    result: str
    result_latex: str
    result_simplified: str
    result_simplified_latex: str
    steps: list[DerivativeStep]


class LimitRequest(BaseModel):
    expression: str
    variable: str = "x"
    point: str  # puede ser un número, "oo" (infinito) o "-oo"
    direction: str = "+-"  # "+", "-", o "+-" (ambos lados)


class LimitResponse(BaseModel):
    original: str
    original_latex: str
    result: str
    result_latex: str
    exists: bool


class IntegralRequest(BaseModel):
    expression: str
    variable: str = "x"
    lower: str | None = None  # si viene, es integral definida
    upper: str | None = None


class IntegralResponse(BaseModel):
    original: str
    original_latex: str
    result: str
    result_latex: str
    is_definite: bool


class PlotRequest(BaseModel):
    expression: str
    x_min: float = -10
    x_max: float = 10
    num_points: int = 200


class PlotPoint(BaseModel):
    x: float
    y: float


class PlotResponse(BaseModel):
    expression: str
    points: list[PlotPoint]
    domain_note: str | None = None


# ==================== ALGEBRA SCHEMAS ====================

class EquationRequest(BaseModel):
    equation: str  # "x**2 - 5*x + 6 = 0"
    variable: str = "x"


class EquationResponse(BaseModel):
    original: str
    original_latex: str
    variable: str
    solutions: list[str]
    solutions_latex: list[str]
    is_quadratic: bool
    num_solutions: int


class SystemRequest(BaseModel):
    equations: list[str]  # ["x + y = 5", "2*x - y = 1"]
    variables: list[str] = ["x", "y"]


class SystemResponse(BaseModel):
    equations: list[str]
    equations_latex: list[str]
    variables: list[str]
    solution: dict  # {"x": "3", "y": "2"}
    solution_latex: dict
    is_solvable: bool


class FactorRequest(BaseModel):
    expression: str
    variable: str = "x"


class FactorResponse(BaseModel):
    original: str
    original_latex: str
    factored: str
    factored_latex: str
    factors: list[str]  # Lista de factores individuales
    factors_latex: list[str]


class SimplifyRequest(BaseModel):
    expression: str


class SimplifyResponse(BaseModel):
    original: str
    original_latex: str
    simplified: str
    simplified_latex: str
    steps: list[dict]  # pasos de simplificación


class ExpandRequest(BaseModel):
    expression: str
    variable: str = "x"


class ExpandResponse(BaseModel):
    original: str
    original_latex: str
    expanded: str
    expanded_latex: str