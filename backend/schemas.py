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


# ==================== MODELING SCHEMAS ====================

class BuildModelRequest(BaseModel):
    equations: list[str]
    parameters: list[str] = []


class BuildModelResponse(BaseModel):
    success: bool
    message: str
    model_info: dict
    equations: list[str]
    equations_latex: list[str]


class PredictRequest(BaseModel):
    expression: str
    variable_values: dict[str, float]


class PredictResponse(BaseModel):
    expression: str
    expression_latex: str
    variable_values: dict[str, float]
    prediction: float
    prediction_rounded: float


class SensitivityRequest(BaseModel):
    expression: str
    parameter: str
    base_values: dict[str, float]
    parameter_min: float = -10
    parameter_max: float = 10
    num_points: int = 50


class ParameterChange(BaseModel):
    parameter_value: float
    output: float


class SensitivityResponse(BaseModel):
    parameter: str
    base_values: dict[str, float]
    sensitivity_at_base: float
    sensitivity_interpretation: str
    parameter_changes: list[ParameterChange]
    derivative_expression: str
    derivative_latex: str


class OptimizationRequest(BaseModel):
    objective_function: str
    variable: str = "x"
    optimization_type: str = "both"  # "max", "min", o "both"


class CriticalPointInfo(BaseModel):
    x: float
    y: float
    type: str
    second_derivative: float


class OptimizationResponse(BaseModel):
    objective_function: str
    objective_latex: str
    variable: str
    first_derivative: str
    first_derivative_latex: str
    critical_points: list[dict]
    optimization_type: str


class PlotModelRequest(BaseModel):
    expression: str
    parameters: dict[str, float] = {}
    x_min: float = -10
    x_max: float = 10
    num_points: int = 200





class PlotModelResponse(BaseModel):
    expression: str
    expression_latex: str
    points: list[PlotPoint]
    x_min: float
    x_max: float
    domain_note: str


# ==================== SIMULATION SCHEMAS ====================

class SimulationDataPoint(BaseModel):
    time: float
    value: float
    rate_of_change: float


class SimulationRequest(BaseModel):
    model_type: str  # "malthus", "logistic", "compound_interest", "decay", "vital_rates"
    initial_value: float
    time_periods: float = 100
    num_points: int = 100
    rate_parameters: dict[str, float]  # {"growth_rate": 0.05, ...}


class SimulationResponse(BaseModel):
    model_type: str
    initial_value: float
    final_value: float
    percent_change: float
    rate_parameters: dict[str, float]
    time_periods: float
    simulation_data: list[SimulationDataPoint]
    interpretation: str


class ClimateDataPoint(BaseModel):
    month: int
    temperature: float
    trend_only: float


class ClimateForecastRequest(BaseModel):
    initial_temperature: float = 20.0
    warming_trend: float = 0.01  # °C por mes
    seasonal_amplitude: float = 5.0  # Variación estacional
    variability: float = 0.5  # Ruido estocástico
    months_to_forecast: int = 120


class ClimateForecastResponse(BaseModel):
    initial_temperature: float
    months_to_forecast: int
    warming_trend: float
    final_temperature: float
    average_temperature: float
    max_temperature: float
    min_temperature: float
    forecast_data: list[ClimateDataPoint]
    interpretation: str


class CompartmentDataPoint(BaseModel):
    day: int
    susceptible: int
    exposed: int
    infected: int
    recovered: int
    total: int


class MultiCompartmentRequest(BaseModel):
    model_type: str = "SEIR"
    initial_values: dict[str, int]  # {"S": 99000, "I": 100, "E": 0, "R": 0}
    transmission_rate: float = 0.0005  # β
    incubation_rate: float = 1/5.1  # σ (período de incubación ~5 días)
    recovery_rate: float = 1/10  # γ (período de recuperación ~10 días)
    days_to_simulate: int = 365


class MultiCompartmentResponse(BaseModel):
    model_type: str
    days_to_simulate: int
    initial_values: dict[str, int]
    transmission_rate: float
    recovery_rate: float
    peak_infected: int
    peak_day: int
    total_infected: int
    simulation_data: list[CompartmentDataPoint]
    interpretation: str


# ==================== PREDEFINED MODELS & ADVANCED ANALYSIS ====================

class ModelInfo(BaseModel):
    id: str
    name: str
    description: str
    equations: list[str]
    variables: list[str]
    default_parameters: dict[str, float]


class PredefinedModelsListResponse(BaseModel):
    total: int
    models: list[ModelInfo]


class PredefinedModelSimulationRequest(BaseModel):
    model_type: str
    initial_conditions: list[float]
    parameters: dict[str, float]
    time_periods: float = 100
    num_points: int = 100


class SimulationDataPoint(BaseModel):
    time: float
    values: dict[str, float]


class PredefinedModelSimulationResponse(BaseModel):
    model_type: str
    initial_conditions: list[float]
    time_periods: float
    parameters: dict[str, float]
    simulation_data: list[SimulationDataPoint]
    interpretation: str


class ParameterSensitivityRequest(BaseModel):
    model_type: str
    parameter_name: str
    parameters: dict[str, float]
    initial_conditions: list[float]
    param_min: float
    param_max: float
    num_points: int = 50
    time_periods: float = 100


class SensitivityDataPoint(BaseModel):
    parameter_value: float
    final_output: float


class ParameterSensitivityResponse(BaseModel):
    model_type: str
    parameter_name: str
    parameter_min: float
    parameter_max: float
    sensitivity_data: list[SensitivityDataPoint]
    interpretation: str


class StochasticSimulationRequest(BaseModel):
    model_type: str
    initial_conditions: list[float]
    parameters: dict[str, float]
    num_simulations: int = 100
    parameter_noise: float = 0.1  # 10% de ruido en parámetros
    measurement_noise: float = 0.05  # 5% de ruido en mediciones
    noise_type: str = "gaussian"  # gaussian, poisson, uniform
    time_periods: float = 100
    num_points: int = 100


class StochasticDataPoint(BaseModel):
    time: float
    mean: float
    std: float
    percentile_5: float
    percentile_95: float


class StochasticSimulationResponse(BaseModel):
    model_type: str
    num_simulations: int
    parameter_noise: float
    measurement_noise: float
    noise_type: str
    statistics_data: list[StochasticDataPoint]
    interpretation: str


class Scenario(BaseModel):
    name: str
    parameters: dict[str, float]


class ScenarioDataPoint(BaseModel):
    time: float
    value: float


class ScenarioResult(BaseModel):
    scenario_name: str
    parameters: dict[str, float]
    data: list[ScenarioDataPoint]
    final_value: float


class ScenarioComparisonRequest(BaseModel):
    model_type: str
    initial_conditions: list[float]
    scenarios: list[Scenario]
    time_periods: float = 100
    num_points: int = 100


class ScenarioComparisonResponse(BaseModel):
    model_type: str
    num_scenarios: int
    time_periods: float
    scenarios: list[ScenarioResult]
    interpretation: str


class ExportSimulationRequest(BaseModel):
    model_name: str
    format: str  # csv, json
    simulation_data: list[dict]