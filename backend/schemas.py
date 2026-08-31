from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Any
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

class DerivativeResponse(BaseModel):
    original: str
    original_latex: str
    result: str
    result_latex: str
    result_simplified: str
    result_simplified_latex: str
    steps: list[DerivativeStep]
    critical_points: list[CriticalPoint] = []

class DerivativeStep(BaseModel):
    description: str
    expression: str


class CriticalPoint(BaseModel):
    x: float
    y: float
    kind: str


class TangentLineRequest(BaseModel):
    expression: str
    point_x: float


class TangentLineResponse(BaseModel):
    point_x: float
    point_y: float
    slope: float
    tangent_expression: str


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

class TriangleRequest(BaseModel):
    side_a: float
    side_b: float
    side_c: float


class TriangleResponse(BaseModel):
    valid: bool
    sides: list[float] | None = None
    angles: list[float] | None = None  # en grados
    perimeter: float | None = None
    area: float | None = None
    type_sides: str | None = None
    type_angles: str | None = None


class CircleRequest(BaseModel):
    radius: float


class CircleResponse(BaseModel):
    radius: float
    diameter: float
    area: float
    circumference: float


class RegularPolygonRequest(BaseModel):
    num_sides: int
    side_length: float


class RegularPolygonResponse(BaseModel):
    num_sides: int
    side_length: float
    perimeter: float
    area: float
    interior_angle: float
    exterior_angle: float

class DescriptiveStatsRequest(BaseModel):
    data: list[float]


class FrequencyRow(BaseModel):
    value: float
    absolute: int
    relative: float


class DescriptiveStatsResponse(BaseModel):
    count: int
    mean: float
    median: float
    mode: float | None
    variance: float
    std_dev: float
    min_value: float
    max_value: float
    frequency_table: list[FrequencyRow]


class CoinFlipRequest(BaseModel):
    num_flips: int = 100


class ConvergencePoint(BaseModel):
    trial: int
    relative_frequency: float


class CoinFlipResponse(BaseModel):
    num_flips: int
    heads_count: int
    tails_count: int
    heads_relative_frequency: float
    theoretical_probability: float
    convergence: list[ConvergencePoint]


class DiceRollRequest(BaseModel):
    num_rolls: int = 100
    num_sides: int = 6


class DiceFrequencyRow(BaseModel):
    value: int
    absolute: int
    relative: float
    theoretical: float


class DiceRollResponse(BaseModel):
    num_rolls: int
    num_sides: int
    frequency_table: list[DiceFrequencyRow]
    mean_result: float

class ExerciseOut(BaseModel):
    id: int
    area: str
    topic: str
    level: str
    difficulty: str
    statement: str
    exercise_type: str
    created_at: datetime

    class Config:
        from_attributes = True


class ExerciseSubmit(BaseModel):
    answer: Any  # la forma depende de exercise_type: string, número, lista, etc.


class ExerciseSubmitResponse(BaseModel):
    is_correct: bool
    correct_answer: Any | None = None  # solo se revela si la respuesta fue incorrecta o ya se agotaron intentos
    explanation: str | None = None
    attempt_number: int


class ExerciseListResponse(BaseModel):
    total: int
    items: list[ExerciseOut]


class FavoriteOut(BaseModel):
    exercise: ExerciseOut

    class Config:
        from_attributes = True