import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Agrega el token a cada request automáticamente, si existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
export interface PlotPoint {
  x: number;
  y: number;
}

export interface PlotResponse {
  expression: string;
  points: PlotPoint[];
  domain_note: string | null;
}

export interface DerivativeStep {
  description: string;
  expression: string;
}

export interface DerivativeResponse {
  original: string;
  original_latex: string;
  result: string;
  result_latex: string;
  result_simplified: string;
  result_simplified_latex: string;
  steps: DerivativeStep[];
  critical_points: CriticalPoint[];
}

export interface LimitResponse {
  original: string;
  original_latex: string;
  result: string;
  result_latex: string;
  exists: boolean;
}

// ==================== ALGEBRA TYPES ====================

export interface EquationResponse {
  original: string;
  original_latex: string;
  variable: string;
  solutions: string[];
  solutions_latex: string[];
  is_quadratic: boolean;
  num_solutions: number;
}

export interface SystemResponse {
  equations: string[];
  equations_latex: string[];
  variables: string[];
  solution: Record<string, string>;
  solution_latex: Record<string, string>;
  is_solvable: boolean;
}

export interface FactorResponse {
  original: string;
  original_latex: string;
  factored: string;
  factored_latex: string;
  factors: string[];
  factors_latex: string[];
}

export interface SimplifyResponse {
  original: string;
  original_latex: string;
  simplified: string;
  simplified_latex: string;
  steps: Array<{ step: string; expression: string }>;
}

export interface ExpandResponse {
  original: string;
  original_latex: string;
  expanded: string;
  expanded_latex: string;
}

// ==================== ALGEBRA API FUNCTIONS ====================

export const algebraAPI = {
  solveEquation: async (equation: string, variable: string = "x") => {
    const response = await api.post<EquationResponse>("/algebra/solve-equation", {
      equation,
      variable,
    });
    return response.data;
  },

  solveSystem: async (equations: string[], variables: string[] = ["x", "y"]) => {
    const response = await api.post<SystemResponse>("/algebra/solve-system", {
      equations,
      variables,
    });
    return response.data;
  },

  factor: async (expression: string, variable: string = "x") => {
    const response = await api.post<FactorResponse>("/algebra/factor", {
      expression,
      variable,
    });
    return response.data;
  },

  simplify: async (expression: string) => {
    const response = await api.post<SimplifyResponse>("/algebra/simplify", {
      expression,
    });
    return response.data;
  },

  expand: async (expression: string, variable: string = "x") => {
    const response = await api.post<ExpandResponse>("/algebra/expand", {
      expression,
      variable,
    });
    return response.data;
  },
};

export interface IntegralResponse {
  original: string;
  original_latex: string;
  result: string;
  result_latex: string;
  is_definite: boolean;
}

export async function calculateLimit(expression: string, point: string, variable = "x") {
  const res = await api.post<LimitResponse>("/api/math/limit", {
    expression,
    variable,
    point,
  });
  return res.data;
}

export async function calculateIntegral(
  expression: string,
  variable = "x",
  lower?: string,
  upper?: string
) {
  const res = await api.post<IntegralResponse>("/api/math/integral", {
    expression,
    variable,
    lower: lower || null,
    upper: upper || null,
  });
  return res.data;
}

export async function plotFunction(expression: string, xMin = -10, xMax = 10) {
  const res = await api.post<PlotResponse>("/api/math/plot", {
    expression,
    x_min: xMin,
    x_max: xMax,
    num_points: 200,
  });
  return res.data;
}

export async function getDerivative(expression: string, respectTo = "x") {
  const res = await api.post<DerivativeResponse>("/api/math/derivative", {
    expression,
    respect_to: respectTo,
  });
  return res.data;
}
export interface TriangleResponse {
  valid: boolean;
  sides?: number[];
  angles?: number[];
  perimeter?: number;
  area?: number;
  type_sides?: string;
  type_angles?: string;
}

export interface CircleResponse {
  radius: number;
  diameter: number;
  area: number;
  circumference: number;
}

export interface RegularPolygonResponse {
  num_sides: number;
  side_length: number;
  perimeter: number;
  area: number;
  interior_angle: number;
  exterior_angle: number;
}

export const geometryAPI = {
  triangle: async (sideA: number, sideB: number, sideC: number) => {
    const res = await api.post<TriangleResponse>("/api/geometry/triangle", {
      side_a: sideA,
      side_b: sideB,
      side_c: sideC,
    });
    return res.data;
  },
  circle: async (radius: number) => {
    const res = await api.post<CircleResponse>("/api/geometry/circle", { radius });
    return res.data;
  },
  regularPolygon: async (numSides: number, sideLength: number) => {
    const res = await api.post<RegularPolygonResponse>("/api/geometry/regular-polygon", {
      num_sides: numSides,
      side_length: sideLength,
    });
    return res.data;
  },
};
export interface CriticalPoint {
  x: number;
  y: number;
  kind: string;
}

export interface TangentLineResponse {
  point_x: number;
  point_y: number;
  slope: number;
  tangent_expression: string;
}

export async function calculateTangentLine(expression: string, pointX: number) {
  const res = await api.post<TangentLineResponse>("/api/math/tangent-line", {
    expression,
    point_x: pointX,
  });
  return res.data;
}

export interface FrequencyRow {
  value: number;
  absolute: number;
  relative: number;
}

export interface DescriptiveStatsResponse {
  count: number;
  mean: number;
  median: number;
  mode: number | null;
  variance: number;
  std_dev: number;
  min_value: number;
  max_value: number;
  frequency_table: FrequencyRow[];
}

export interface ConvergencePoint {
  trial: number;
  relative_frequency: number;
}

export interface CoinFlipResponse {
  num_flips: number;
  heads_count: number;
  tails_count: number;
  heads_relative_frequency: number;
  theoretical_probability: number;
  convergence: ConvergencePoint[];
}

export interface DiceFrequencyRow {
  value: number;
  absolute: number;
  relative: number;
  theoretical: number;
}

export interface DiceRollResponse {
  num_rolls: number;
  num_sides: number;
  frequency_table: DiceFrequencyRow[];
  mean_result: number;
}

export const statsAPI = {
  descriptive: async (data: number[]) => {
    const res = await api.post<DescriptiveStatsResponse>("/api/stats/descriptive", { data });
    return res.data;
  },
  simulateCoin: async (numFlips: number) => {
    const res = await api.post<CoinFlipResponse>("/api/stats/simulate-coin", { num_flips: numFlips });
    return res.data;
  },
  simulateDice: async (numRolls: number, numSides: number = 6) => {
    const res = await api.post<DiceRollResponse>("/api/stats/simulate-dice", {
      num_rolls: numRolls,
      num_sides: numSides,
    });
    return res.data;
  },
};

// ==================== MODELING TYPES ====================

export interface BuildModelResponse {
  success: boolean;
  message: string;
  model_info: Record<string, any>;
  equations: string[];
  equations_latex: string[];
}

export interface PredictResponse {
  expression: string;
  expression_latex: string;
  variable_values: Record<string, number>;
  prediction: number;
  prediction_rounded: number;
}

export interface ParameterChange {
  parameter_value: number;
  output: number;
}

export interface SensitivityResponse {
  parameter: string;
  base_values: Record<string, number>;
  sensitivity_at_base: number;
  sensitivity_interpretation: string;
  parameter_changes: ParameterChange[];
  derivative_expression: string;
  derivative_latex: string;
}

export interface CriticalPointInfo {
  x: number;
  y: number;
  type: string;
  second_derivative: number;
}

export interface OptimizationResponse {
  objective_function: string;
  objective_latex: string;
  variable: string;
  first_derivative: string;
  first_derivative_latex: string;
  critical_points: CriticalPointInfo[];
  optimization_type: string;
}

export interface PlotModelPoint {
  x: number;
  y: number;
}

export interface PlotModelResponse {
  expression: string;
  expression_latex: string;
  points: PlotModelPoint[];
  x_min: number;
  x_max: number;
  domain_note: string;
}

export const modelingAPI = {
  buildModel: async (equations: string[], parameters: string[] = []) => {
    const res = await api.post<BuildModelResponse>("/api/modeling/build-model", {
      equations,
      parameters,
    });
    return res.data;
  },

  predict: async (expression: string, variableValues: Record<string, number>) => {
    const res = await api.post<PredictResponse>("/api/modeling/predict", {
      expression,
      variable_values: variableValues,
    });
    return res.data;
  },

  sensitivityAnalysis: async (
    expression: string,
    parameter: string,
    baseValues: Record<string, number>,
    parameterMin: number = -10,
    parameterMax: number = 10,
    numPoints: number = 50
  ) => {
    const res = await api.post<SensitivityResponse>("/api/modeling/sensitivity-analysis", {
      expression,
      parameter,
      base_values: baseValues,
      parameter_min: parameterMin,
      parameter_max: parameterMax,
      num_points: numPoints,
    });
    return res.data;
  },

  optimize: async (
    objectiveFunction: string,
    variable: string = "x",
    optimizationType: string = "both"
  ) => {
    const res = await api.post<OptimizationResponse>("/api/modeling/optimization", {
      objective_function: objectiveFunction,
      variable,
      optimization_type: optimizationType,
    });
    return res.data;
  },

  plotModel: async (
    expression: string,
    parameters: Record<string, number> = {},
    xMin: number = -10,
    xMax: number = 10,
    numPoints: number = 200
  ) => {
    const res = await api.post<PlotModelResponse>("/api/modeling/plot-model", {
      expression,
      parameters,
      x_min: xMin,
      x_max: xMax,
      num_points: numPoints,
    });
    return res.data;
  },

  simulateGrowth: async (
    modelType: string,
    initialValue: number,
    ratParameters: Record<string, number>,
    timePeriods: number = 100,
    numPoints: number = 100
  ) => {
    const res = await api.post<SimulationResponse>("/api/modeling/simulate-growth", {
      model_type: modelType,
      initial_value: initialValue,
      rate_parameters: ratParameters,
      time_periods: timePeriods,
      num_points: numPoints,
    });
    return res.data;
  },

  climateForecast: async (
    initialTemperature: number = 20,
    warmingTrend: number = 0.01,
    seasonalAmplitude: number = 5,
    variability: number = 0.5,
    monthsToForecast: number = 120
  ) => {
    const res = await api.post<ClimateForecastResponse>("/api/modeling/climate-forecast", {
      initial_temperature: initialTemperature,
      warming_trend: warmingTrend,
      seasonal_amplitude: seasonalAmplitude,
      variability,
      months_to_forecast: monthsToForecast,
    });
    return res.data;
  },

  epidemiologicalModel: async (
    initialValues: Record<string, number>,
    transmissionRate: number = 0.0005,
    incubationRate: number = 1 / 5.1,
    recoveryRate: number = 1 / 10,
    daysToSimulate: number = 365
  ) => {
    const res = await api.post<MultiCompartmentResponse>("/api/modeling/multi-compartment-model", {
      model_type: "SEIR",
      initial_values: initialValues,
      transmission_rate: transmissionRate,
      incubation_rate: incubationRate,
      recovery_rate: recoveryRate,
      days_to_simulate: daysToSimulate,
    });
    return res.data;
  },
};

// ==================== SIMULATION TYPES ====================

export interface SimulationDataPoint {
  time: number;
  value: number;
  rate_of_change: number;
}

export interface SimulationResponse {
  model_type: string;
  initial_value: number;
  final_value: number;
  percent_change: number;
  rate_parameters: Record<string, number>;
  time_periods: number;
  simulation_data: SimulationDataPoint[];
  interpretation: string;
}

export interface ClimateDataPoint {
  month: number;
  temperature: number;
  trend_only: number;
}

export interface ClimateForecastResponse {
  initial_temperature: number;
  months_to_forecast: number;
  warming_trend: number;
  final_temperature: number;
  average_temperature: number;
  max_temperature: number;
  min_temperature: number;
  forecast_data: ClimateDataPoint[];
  interpretation: string;
}

export interface CompartmentDataPoint {
  day: number;
  susceptible: number;
  exposed: number;
  infected: number;
  recovered: number;
  total: number;
}

export interface MultiCompartmentResponse {
  model_type: string;
  days_to_simulate: number;
  initial_values: Record<string, number>;
  transmission_rate: number;
  recovery_rate: number;
  peak_infected: number;
  peak_day: number;
  total_infected: number;
  simulation_data: CompartmentDataPoint[];
  interpretation: string;
}

// ==================== PREDEFINED MODELS & ADVANCED ====================

export interface ModelInfo {
  id: string;
  name: string;
  description: string;
  equations: string[];
  variables: string[];
}

export interface PredefinedModelsListResponse {
  total: number;
  models: ModelInfo[];
}

export interface PredefinedModelSimulationResponse {
  model_type: string;
  initial_conditions: number[];
  time_periods: number;
  parameters: Record<string, number>;
  simulation_data: Array<{
    time: number;
    values: Record<string, number>;
  }>;
  interpretation: string;
}

export interface ParameterSensitivityResponse {
  model_type: string;
  parameter_name: string;
  parameter_min: number;
  parameter_max: number;
  sensitivity_data: Array<{
    parameter_value: number;
    final_output: number;
  }>;
  interpretation: string;
}

export interface StochasticSimulationResponse {
  model_type: string;
  num_simulations: number;
  parameter_noise: number;
  measurement_noise: number;
  noise_type: string;
  statistics_data: Array<{
    time: number;
    mean: number;
    std: number;
    percentile_5: number;
    percentile_95: number;
  }>;
  interpretation: string;
}

export interface ScenarioComparisonResponse {
  model_type: string;
  num_scenarios: number;
  time_periods: number;
  scenarios: Array<{
    scenario_name: string;
    parameters: Record<string, number>;
    data: Array<{ time: number; value: number }>;
    final_value: number;
  }>;
  interpretation: string;
}

export const advancedModelingAPI = {
  listPredefinedModels: async () => {
    const res = await api.get<PredefinedModelsListResponse>("/api/modeling/predefined-models");
    return res.data;
  },

  simulatePredefinedModel: async (
    modelType: string,
    initialConditions: number[],
    parameters: Record<string, number>,
    timePeriods: number = 100,
    numPoints: number = 100
  ) => {
    const res = await api.post<PredefinedModelSimulationResponse>(
      "/api/modeling/simulate-predefined-model",
      {
        model_type: modelType,
        initial_conditions: initialConditions,
        parameters,
        time_periods: timePeriods,
        num_points: numPoints,
      }
    );
    return res.data;
  },

  parameterSensitivityAnalysis: async (
    modelType: string,
    parameterName: string,
    parameters: Record<string, number>,
    initialConditions: number[],
    paramMin: number = 0,
    paramMax: number = 1,
    numPoints: number = 50,
    timePeriods: number = 100
  ) => {
    const res = await api.post<ParameterSensitivityResponse>(
      "/api/modeling/parameter-sensitivity-analysis",
      {
        model_type: modelType,
        parameter_name: parameterName,
        parameters,
        initial_conditions: initialConditions,
        param_min: paramMin,
        param_max: paramMax,
        num_points: numPoints,
        time_periods: timePeriods,
      }
    );
    return res.data;
  },

  stochasticSimulation: async (
    modelType: string,
    initialConditions: number[],
    parameters: Record<string, number>,
    numSimulations: number = 100,
    parameterNoise: number = 0.1,
    measurementNoise: number = 0.05,
    noiseType: string = "gaussian",
    timePeriods: number = 100,
    numPoints: number = 100
  ) => {
    const res = await api.post<StochasticSimulationResponse>(
      "/api/modeling/stochastic-simulation",
      {
        model_type: modelType,
        initial_conditions: initialConditions,
        parameters,
        num_simulations: numSimulations,
        parameter_noise: parameterNoise,
        measurement_noise: measurementNoise,
        noise_type: noiseType,
        time_periods: timePeriods,
        num_points: numPoints,
      }
    );
    return res.data;
  },

  compareScenarios: async (
    modelType: string,
    initialConditions: number[],
    scenarios: Array<{ name: string; parameters: Record<string, number> }>,
    timePeriods: number = 100,
    numPoints: number = 100
  ) => {
    const res = await api.post<ScenarioComparisonResponse>(
      "/api/modeling/compare-scenarios",
      {
        model_type: modelType,
        initial_conditions: initialConditions,
        scenarios,
        time_periods: timePeriods,
        num_points: numPoints,
      }
    );
    return res.data;
  },

  exportSimulation: async (
    modelName: string,
    format: "csv" | "json",
    simulationData: Array<Record<string, any>>
  ) => {
    const res = await api.post("/api/modeling/export-simulation", {
      model_name: modelName,
      format,
      simulation_data: simulationData,
    });
    return res.data;
  },
};