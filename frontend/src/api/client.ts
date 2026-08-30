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
}

export interface LimitResponse {
  original: string;
  original_latex: string;
  result: string;
  result_latex: string;
  exists: boolean;
}

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