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