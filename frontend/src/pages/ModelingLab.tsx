import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  modelingAPI,
  advancedModelingAPI,
  type PlotModelResponse,
  type SensitivityResponse,
  type OptimizationResponse,
  type PredictResponse,
  type SimulationResponse,
  type ClimateForecastResponse,
  type MultiCompartmentResponse,
  type PredefinedModelsListResponse,
  type PredefinedModelSimulationResponse,
  type ParameterSensitivityResponse,
  type StochasticSimulationResponse,
  type ScenarioComparisonResponse,
} from "../api/client";
import MathDisplay from "../components/MathDisplay";
import "../styles/ModelingLab.css";

type TabType = "build" | "predict" | "sensitivity" | "optimize" | "visualize" | "evolution" | "climate" | "epidemiology" | "advanced";

export default function ModelingLab() {
  const [activeTab, setActiveTab] = useState<TabType>("build");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Build Model Tab
  const [equations, setEquations] = useState(["x + y - 5", "2*x - y - 1"]);
  const [parameters, setParameters] = useState<string[]>([]);
  const [buildResult, setBuildResult] = useState<any>(null);

  // Predict Tab
  const [predictExpression, setPredictExpression] = useState("x**2 + 2*y");
  const [variableValues, setVariableValues] = useState<Record<string, number>>({ x: 3, y: 2 });
  const [predictResult, setPredictResult] = useState<PredictResponse | null>(null);

  // Sensitivity Tab
  const [sensExpression, setSensExpression] = useState("0.5*a*t**2");
  const [sensParameter, setSensParameter] = useState("a");
  const [sensBaseValues, setSensBaseValues] = useState<Record<string, number>>({ t: 10 });
  const [sensResult, setSensResult] = useState<SensitivityResponse | null>(null);

  // Optimization Tab
  const [objFunction, setObjFunction] = useState("-x**2 + 4*x");
  const [optVariable, setOptVariable] = useState("x");
  const [optType, setOptType] = useState<"max" | "min" | "both">("both");
  const [optimResult, setOptimResult] = useState<OptimizationResponse | null>(null);

  // Visualization Tab
  const [vizExpression, setVizExpression] = useState("sin(x) * exp(-x/10)");
  const [vizParameters, setVizParameters] = useState<Record<string, number>>({});
  const [xMin, setXMin] = useState(-10);
  const [xMax, setXMax] = useState(10);
  const [plotData, setPlotData] = useState<PlotModelResponse | null>(null);

  // Evolution/Growth Tab
  const [simModelType, setSimModelType] = useState<string>("logistic");
  const [simInitialValue, setSimInitialValue] = useState(100);
  const [simGrowthRate, setSimGrowthRate] = useState(0.05);
  const [simCarryingCapacity, setSimCarryingCapacity] = useState(10000);
  const [simTimePeriods, setSimTimePeriods] = useState(100);
  const [simResult, setSimResult] = useState<SimulationResponse | null>(null);

  // Climate Forecast Tab
  const [climateInitialTemp, setClimateInitialTemp] = useState(20);
  const [climateWarmingTrend, setClimateWarmingTrend] = useState(0.02);
  const [climateSeasonalAmp, setClimateSeasonalAmp] = useState(5);
  const [climateMonths, setClimateMonths] = useState(120);
  const [climateResult, setClimateResult] = useState<ClimateForecastResponse | null>(null);

  // Epidemiology Tab (SEIR Model)
  const [epidemiologySusceptible, setEpidemiologySusceptible] = useState(99000);
  const [epidemiologyInfected, setEpidemiologyInfected] = useState(100);
  const [epidemiologyExposed, setEpidemiologyExposed] = useState(0);
  const [epidemiologyRecovered, setEpidemiologyRecovered] = useState(0);
  const [epidemiologyTransmissionRate, setEpidemiologyTransmissionRate] = useState(0.0005);
  const [epidemiologyRecoveryRate, setEpidemiologyRecoveryRate] = useState(0.1);
  const [epidemiologyDays, setEpidemiologyDays] = useState(365);
  const [epidemiologyResult, setEpidemiologyResult] = useState<MultiCompartmentResponse | null>(null);

  // Advanced Models Tab
  const [predefinedModels, setPredefinedModels] = useState<PredefinedModelsListResponse | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>("covid19");
  const [predefinedResult, setPredefinedResult] = useState<PredefinedModelSimulationResponse | null>(null);
  const [sensResult2, setSensResult2] = useState<ParameterSensitivityResponse | null>(null);
  const [stochasticResult, setStochasticResult] = useState<StochasticSimulationResponse | null>(null);
  const [scenarioResult, setScenarioResult] = useState<ScenarioComparisonResponse | null>(null);
  const [currentInitialConditions, setCurrentInitialConditions] = useState<number[]>([]);
  const [currentParameters, setCurrentParameters] = useState<Record<string, number>>({});

  const currentModelInfo = predefinedModels?.models.find((m) => m.id === selectedModel);

  useEffect(() => {
    if (currentModelInfo) {
      setCurrentInitialConditions(currentModelInfo.variables.map(() => 100));
      // NOTA: "default_parameters" no está tipado hoy en PredefinedModelsListResponse
      // (api/client.ts). Se castea a `any` para no romper el build; si lo agregás al
      // tipo del backend/frontend, sacá el `as any`.
      setCurrentParameters((currentModelInfo as any).default_parameters ?? {});
    }
  }, [selectedModel, predefinedModels]);

  async function handleBuildModel(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.buildModel(equations, parameters);
      setBuildResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al construir el modelo");
    } finally {
      setLoading(false);
    }
  }

  async function handlePredict(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.predict(predictExpression, variableValues);
      setPredictResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en la predicción");
    } finally {
      setLoading(false);
    }
  }

  async function handleSensitivity(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.sensitivityAnalysis(
        sensExpression,
        sensParameter,
        sensBaseValues
      );
      setSensResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en análisis de sensibilidad");
    } finally {
      setLoading(false);
    }
  }

  async function handleOptimization(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.optimize(objFunction, optVariable, optType);
      setOptimResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en optimización");
    } finally {
      setLoading(false);
    }
  }

  async function handleVisualize(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.plotModel(
        vizExpression,
        vizParameters,
        xMin,
        xMax
      );
      setPlotData(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error al graficar");
    } finally {
      setLoading(false);
    }
  }

  function addEquation() {
    setEquations([...equations, ""]);
  }

  function removeEquation(index: number) {
    setEquations(equations.filter((_, i) => i !== index));
  }

  function updateEquation(index: number, value: string) {
    const newEquations = [...equations];
    newEquations[index] = value;
    setEquations(newEquations);
  }

  function updateVariableValue(variable: string, value: number) {
    setVariableValues({ ...variableValues, [variable]: value });
  }

  async function handleSimulation(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const rateParams: Record<string, number> = {
        growth_rate: simGrowthRate,
        carrying_capacity: simCarryingCapacity,
      };
      const result = await modelingAPI.simulateGrowth(
        simModelType,
        simInitialValue,
        rateParams,
        simTimePeriods,
        100
      );
      setSimResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en simulación");
    } finally {
      setLoading(false);
    }
  }

  async function handleClimateForcast(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.climateForecast(
        climateInitialTemp,
        climateWarmingTrend,
        climateSeasonalAmp,
        0.5,
        climateMonths
      );
      setClimateResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en pronóstico climático");
    } finally {
      setLoading(false);
    }
  }

  async function handleEpidemiologyModel(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await modelingAPI.epidemiologicalModel(
        {
          S: epidemiologySusceptible,
          E: epidemiologyExposed,
          I: epidemiologyInfected,
          R: epidemiologyRecovered,
        },
        epidemiologyTransmissionRate,
        1 / 5.1,
        epidemiologyRecoveryRate,
        epidemiologyDays
      );
      setEpidemiologyResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en modelo epidemiológico");
    } finally {
      setLoading(false);
    }
  }

  // Advanced Models Functions
  async function loadPredefinedModels() {
    try {
      const models = await advancedModelingAPI.listPredefinedModels();
      setPredefinedModels(models);
    } catch (err: any) {
      setError("Error cargando modelos predefinidos");
    }
  }

  async function handlePredefinedModel(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await advancedModelingAPI.simulatePredefinedModel(
        selectedModel,
        currentInitialConditions,
        currentParameters,
        100,
        200
      );
      setPredefinedResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error simulando modelo predefinido");
    } finally {
      setLoading(false);
    }
  }

  async function handleSensitivityAnalysis2(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await advancedModelingAPI.parameterSensitivityAnalysis(
        selectedModel,
        "transmission_rate",
        { transmission_rate: 0.5, recovery_rate: 0.1 },
        [99000, 100],
        0.1,
        1.0,
        50
      );
      setSensResult2(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en análisis de sensibilidad");
    } finally {
      setLoading(false);
    }
  }

  async function handleStochasticSimulation(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await advancedModelingAPI.stochasticSimulation(
        selectedModel,
        [99000, 100],
        { transmission_rate: 0.5, recovery_rate: 0.1 },
        100,
        0.1,
        0.05
      );
      setStochasticResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error en simulación estocástica");
    } finally {
      setLoading(false);
    }
  }

  async function handleScenarioComparison(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await advancedModelingAPI.compareScenarios(
        selectedModel,
        [99000, 100],
        [
          { name: "Escenario Base", parameters: { transmission_rate: 0.5, recovery_rate: 0.1 } },
          { name: "Transmisión Alta", parameters: { transmission_rate: 0.8, recovery_rate: 0.1 } },
          { name: "Recuperación Rápida", parameters: { transmission_rate: 0.5, recovery_rate: 0.2 } },
        ]
      );
      setScenarioResult(result);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "Error comparando escenarios");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modeling-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>🧬 Laboratorio de Modelaje Matemático</h1>
      <p className="lab-subtitle">
        Construye, analiza y optimiza modelos matemáticos complejos
      </p>

      {error && <div className="error">{error}</div>}

      <div className="tabs">
        <button
          className={`tab ${activeTab === "build" ? "active" : ""}`}
          onClick={() => setActiveTab("build")}
        >
          📐 Construir
        </button>
        <button
          className={`tab ${activeTab === "predict" ? "active" : ""}`}
          onClick={() => setActiveTab("predict")}
        >
          🔮 Predecir
        </button>
        <button
          className={`tab ${activeTab === "sensitivity" ? "active" : ""}`}
          onClick={() => setActiveTab("sensitivity")}
        >
          📊 Sensibilidad
        </button>
        <button
          className={`tab ${activeTab === "optimize" ? "active" : ""}`}
          onClick={() => setActiveTab("optimize")}
        >
          🎯 Optimizar
        </button>
        <button
          className={`tab ${activeTab === "visualize" ? "active" : ""}`}
          onClick={() => setActiveTab("visualize")}
        >
          📈 Visualizar
        </button>
        <button
          className={`tab ${activeTab === "evolution" ? "active" : ""}`}
          onClick={() => setActiveTab("evolution")}
        >
          📉 Evolución
        </button>
        <button
          className={`tab ${activeTab === "climate" ? "active" : ""}`}
          onClick={() => setActiveTab("climate")}
        >
          🌡️ Clima
        </button>
        <button
          className={`tab ${activeTab === "epidemiology" ? "active" : ""}`}
          onClick={() => setActiveTab("epidemiology")}
        >
          🦠 Epidemiología
        </button>
        <button
          className={`tab ${activeTab === "advanced" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("advanced");
            loadPredefinedModels();
          }}
        >
          🚀 Avanzado
        </button>
      </div>

      {/* BUILD MODEL TAB */}
      {activeTab === "build" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Construir Modelo Matemático</h2>
            <p>Define ecuaciones y parámetros para tu modelo.</p>

            <form onSubmit={handleBuildModel} className="input-form">
              <div className="form-section">
                <label>Ecuaciones</label>
                {equations.map((eq, idx) => (
                  <div key={idx} className="equation-row">
                    <input
                      value={eq}
                      onChange={(e) => updateEquation(idx, e.target.value)}
                      placeholder={`Ecuación ${idx + 1}`}
                      type="text"
                    />
                    {equations.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEquation(idx)}
                        className="btn-remove"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addEquation} className="btn-add">
                  + Agregar ecuación
                </button>
              </div>

              <div className="form-section">
                <label>Parámetros (separados por comas)</label>
                <input
                  value={parameters.join(", ")}
                  onChange={(e) =>
                    setParameters(e.target.value.split(",").map((p) => p.trim()))
                  }
                  placeholder="a, b, c"
                  type="text"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "📐"}</span>
                {loading ? "Construyendo..." : "Construir Modelo"}
              </button>
            </form>

            {buildResult && (
              <div className="result-section">
                <h3>✅ Modelo Construido</h3>
                <div className="model-info">
                  <p>
                    <strong>Ecuaciones:</strong> {buildResult.model_info.num_equations}
                  </p>
                  <p>
                    <strong>Variables:</strong> {buildResult.model_info.variables.join(", ")}
                  </p>
                  <p>
                    <strong>Parámetros:</strong>{" "}
                    {buildResult.model_info.parameters.length > 0
                      ? buildResult.model_info.parameters.join(", ")
                      : "Ninguno"}
                  </p>
                </div>
                <div className="equations-display">
                  {buildResult.equations_latex.map((latex: string, i: number) => (
                    <div key={i} className="equation-item">
                      <MathDisplay latex={latex} block />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PREDICT TAB */}
      {activeTab === "predict" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Hacer Predicciones</h2>
            <p>Evalúa tu modelo con valores específicos.</p>

            <form onSubmit={handlePredict} className="input-form">
              <div className="form-section">
                <label>Expresión</label>
                <input
                  value={predictExpression}
                  onChange={(e) => setPredictExpression(e.target.value)}
                  placeholder="x**2 + 2*y"
                  type="text"
                />
              </div>

              <div className="form-section">
                <label>Valores de Variables</label>
                {Object.entries(variableValues).map(([variable, value]) => (
                  <div key={variable} className="variable-input">
                    <label>{variable} =</label>
                    <input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) =>
                        updateVariableValue(variable, parseFloat(e.target.value))
                      }
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "🔮"}</span>
                {loading ? "Calculando..." : "Predecir"}
              </button>
            </form>

            {predictResult && (
              <div className="result-section">
                <h3>📊 Resultado de la Predicción</h3>
                <div className="prediction-display">
                  <MathDisplay latex={`f = ${predictResult.expression_latex}`} block />
                  <div className="prediction-value">
                    <h4>Resultado:</h4>
                    <p className="big-number">{predictResult.prediction_rounded}</p>
                  </div>
                  <div className="variables-used">
                    <h4>Variables utilizadas:</h4>
                    {Object.entries(predictResult.variable_values).map(([var_name, val]) => (
                      <p key={var_name}>
                        {var_name} = {val}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SENSITIVITY TAB */}
      {activeTab === "sensitivity" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Análisis de Sensibilidad</h2>
            <p>Analiza cómo cambia el modelo cuando varían los parámetros.</p>

            <form onSubmit={handleSensitivity} className="input-form">
              <div className="form-section">
                <label>Expresión</label>
                <input
                  value={sensExpression}
                  onChange={(e) => setSensExpression(e.target.value)}
                  placeholder="0.5*a*t**2"
                  type="text"
                />
              </div>

              <div className="form-section">
                <label>Parámetro a variar</label>
                <input
                  value={sensParameter}
                  onChange={(e) => setSensParameter(e.target.value)}
                  placeholder="a"
                  type="text"
                />
              </div>

              <div className="form-section">
                <label>Valores base de variables</label>
                {Object.entries(sensBaseValues).map(([variable, value]) => (
                  <div key={variable} className="variable-input">
                    <label>{variable} =</label>
                    <input
                      type="number"
                      step="0.1"
                      value={value}
                      onChange={(e) =>
                        setSensBaseValues({
                          ...sensBaseValues,
                          [variable]: parseFloat(e.target.value),
                        })
                      }
                    />
                  </div>
                ))}
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "📊"}</span>
                {loading ? "Analizando..." : "Analizar Sensibilidad"}
              </button>
            </form>

            {sensResult && (
              <div className="result-section">
                <h3>📉 Análisis de Sensibilidad</h3>
                <div className="sensitivity-info">
                  <p>
                    <strong>Parámetro:</strong> {sensResult.parameter}
                  </p>
                  <p>
                    <strong>Sensibilidad en punto base:</strong>{" "}
                    {sensResult.sensitivity_at_base}
                  </p>
                  <p className="sensitivity-interpretation">
                    <strong>Interpretación:</strong> {sensResult.sensitivity_interpretation}
                  </p>
                  <div className="derivative-display">
                    <MathDisplay
                      latex={`\\frac{\\partial f}{\\partial ${sensResult.parameter}} = ${sensResult.derivative_latex}`}
                      block
                    />
                  </div>
                </div>

                {sensResult.parameter_changes.length > 0 && (
                  <div className="chart-container">
                    <h4>📊 Cambios en el parámetro</h4>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={sensResult.parameter_changes}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="parameter_value" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            formatter={(value) => {
                              if (typeof value === "number") return value.toFixed(3);
                              return value;
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="output"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* OPTIMIZATION TAB */}
      {activeTab === "optimize" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Optimización de Modelos</h2>
            <p>Encuentra máximos, mínimos y puntos críticos.</p>

            <form onSubmit={handleOptimization} className="input-form">
              <div className="form-section">
                <label>Función Objetivo</label>
                <input
                  value={objFunction}
                  onChange={(e) => setObjFunction(e.target.value)}
                  placeholder="-x**2 + 4*x"
                  type="text"
                />
              </div>

              <div className="form-section">
                <label>Variable</label>
                <input
                  value={optVariable}
                  onChange={(e) => setOptVariable(e.target.value)}
                  placeholder="x"
                  type="text"
                  style={{ maxWidth: "100px" }}
                />
              </div>

              <div className="form-section">
                <label>Tipo de optimización</label>
                <select
                  value={optType}
                  onChange={(e) => setOptType(e.target.value as "max" | "min" | "both")}
                  className="select-input"
                >
                  <option value="max">Maximizar</option>
                  <option value="min">Minimizar</option>
                  <option value="both">Ambos</option>
                </select>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "🎯"}</span>
                {loading ? "Optimizando..." : "Encontrar Extremos"}
              </button>
            </form>

            {optimResult && (
              <div className="result-section">
                <h3>🎯 Puntos Críticos</h3>
                <div className="objective-display">
                  <MathDisplay latex={`f(${optimResult.variable}) = ${optimResult.objective_latex}`} block />
                  <MathDisplay
                    latex={`f'(${optimResult.variable}) = ${optimResult.first_derivative_latex}`}
                    block
                  />
                </div>

                {optimResult.critical_points && optimResult.critical_points.length > 0 ? (
                  <div className="critical-points-list">
                    <h4>Puntos encontrados:</h4>
                    {optimResult.critical_points.map((point: any, idx: number) => (
                      <div key={idx} className="critical-point-card">
                        <p>
                          <strong>{point.type}</strong>
                        </p>
                        <p>
                          {optimResult.variable} = {point.x}
                        </p>
                        <p>f({optimResult.variable}) = {point.y}</p>
                        <p className="second-deriv">
                          f''({optimResult.variable}) = {point.second_derivative}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-results">
                    No se encontraron puntos críticos con solución analítica.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VISUALIZATION TAB */}
      {activeTab === "visualize" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Visualizar Modelo</h2>
            <p>Grafica tu modelo para analizar su comportamiento.</p>

            <form onSubmit={handleVisualize} className="input-form">
              <div className="form-section">
                <label>Expresión</label>
                <input
                  value={vizExpression}
                  onChange={(e) => setVizExpression(e.target.value)}
                  placeholder="sin(x) * exp(-x/10)"
                  type="text"
                />
              </div>

              <div className="form-section">
                <label>Rango X</label>
                <div className="range-inputs">
                  <div>
                    <label>Mín:</label>
                    <input
                      type="number"
                      value={xMin}
                      onChange={(e) => setXMin(parseFloat(e.target.value))}
                    />
                  </div>
                  <div>
                    <label>Máx:</label>
                    <input
                      type="number"
                      value={xMax}
                      onChange={(e) => setXMax(parseFloat(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "📈"}</span>
                {loading ? "Graficando..." : "Visualizar"}
              </button>
            </form>

            {plotData && (
              <div className="chart-container">
                <h3>📊 Gráfica del Modelo</h3>
                <div className="model-display">
                  <MathDisplay latex={`f(x) = ${plotData.expression_latex}`} block />
                </div>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={plotData.points}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis
                        dataKey="x"
                        type="number"
                        domain={["dataMin", "dataMax"]}
                        stroke="#6b7280"
                      />
                      <YAxis stroke="#6b7280" />
                      <Tooltip
                        formatter={(value) => {
                          if (typeof value === "number") return value.toFixed(3);
                          return value;
                        }}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="5 5" />
                      <ReferenceLine x={0} stroke="#d1d5db" strokeDasharray="5 5" />
                      <Line
                        type="monotone"
                        dataKey="y"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {plotData.domain_note && (
                  <p className="domain-note">ℹ️ {plotData.domain_note}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EVOLUTION TAB */}
      {activeTab === "evolution" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Simulación de Evolución</h2>
            <p>Simula crecimiento poblacional, interés compuesto, o decaimiento.</p>

            <form onSubmit={handleSimulation} className="input-form">
              <div className="form-section">
                <label>Tipo de Modelo</label>
                <select
                  value={simModelType}
                  onChange={(e) => setSimModelType(e.target.value)}
                  className="select-input"
                >
                  <option value="malthus">Crecimiento Exponencial (Malthus)</option>
                  <option value="logistic">Crecimiento Logístico (con límite)</option>
                  <option value="compound_interest">Interés Compuesto</option>
                  <option value="decay">Decaimiento Exponencial</option>
                  <option value="vital_rates">Tasas Vitales (natalidad/mortalidad)</option>
                </select>
              </div>

              <div className="form-section">
                <label>Valor Inicial</label>
                <input
                  type="number"
                  value={simInitialValue}
                  onChange={(e) => setSimInitialValue(parseFloat(e.target.value))}
                  step="1"
                />
              </div>

              <div className="form-section">
                <label>Tasa de Crecimiento/Interés (por período)</label>
                <input
                  type="number"
                  value={simGrowthRate}
                  onChange={(e) => setSimGrowthRate(parseFloat(e.target.value))}
                  step="0.01"
                  placeholder="0.05"
                />
              </div>

              {simModelType === "logistic" && (
                <div className="form-section">
                  <label>Capacidad de Carga (máximo)</label>
                  <input
                    type="number"
                    value={simCarryingCapacity}
                    onChange={(e) => setSimCarryingCapacity(parseFloat(e.target.value))}
                    step="100"
                  />
                </div>
              )}

              <div className="form-section">
                <label>Períodos de Tiempo</label>
                <input
                  type="number"
                  value={simTimePeriods}
                  onChange={(e) => setSimTimePeriods(parseFloat(e.target.value))}
                  step="10"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "📉"}</span>
                {loading ? "Simulando..." : "Simular"}
              </button>
            </form>

            {simResult && (
              <div className="result-section">
                <h3>📊 Resultado de la Simulación</h3>
                <div className="simulation-stats">
                  <div className="stat-card">
                    <h4>Valor Inicial</h4>
                    <p className="stat-value">{simResult.initial_value}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Valor Final</h4>
                    <p className="stat-value">{simResult.final_value.toFixed(2)}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Cambio</h4>
                    <p className="stat-value">{simResult.percent_change.toFixed(2)}%</p>
                  </div>
                </div>

                <p className="interpretation">
                  <strong>Interpretación:</strong> {simResult.interpretation}
                </p>

                {simResult.simulation_data && (
                  <div className="chart-container">
                    <h4>📈 Evolución en el Tiempo</h4>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={simResult.simulation_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="time" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            formatter={(value) => {
                              if (typeof value === "number") return value.toFixed(2);
                              return value;
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* CLIMATE FORECAST TAB */}
      {activeTab === "climate" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Pronóstico Climático</h2>
            <p>Predice cambios de temperatura con tendencia y variabilidad estacional.</p>

            <form onSubmit={handleClimateForcast} className="input-form">
              <div className="form-section">
                <label>Temperatura Inicial (°C)</label>
                <input
                  type="number"
                  value={climateInitialTemp}
                  onChange={(e) => setClimateInitialTemp(parseFloat(e.target.value))}
                  step="0.1"
                />
              </div>

              <div className="form-section">
                <label>Tendencia de Calentamiento (°C/mes)</label>
                <input
                  type="number"
                  value={climateWarmingTrend}
                  onChange={(e) => setClimateWarmingTrend(parseFloat(e.target.value))}
                  step="0.001"
                  placeholder="0.02"
                />
              </div>

              <div className="form-section">
                <label>Amplitud de Variación Estacional (°C)</label>
                <input
                  type="number"
                  value={climateSeasonalAmp}
                  onChange={(e) => setClimateSeasonalAmp(parseFloat(e.target.value))}
                  step="0.5"
                />
              </div>

              <div className="form-section">
                <label>Meses a Pronosticar</label>
                <input
                  type="number"
                  value={climateMonths}
                  onChange={(e) => setClimateMonths(parseFloat(e.target.value))}
                  step="12"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "🌡️"}</span>
                {loading ? "Pronosticando..." : "Generar Pronóstico"}
              </button>
            </form>

            {climateResult && (
              <div className="result-section">
                <h3>🌡️ Pronóstico Climático</h3>
                <div className="climate-stats">
                  <div className="stat-card">
                    <h4>Temperatura Promedio</h4>
                    <p className="stat-value">{climateResult.average_temperature}°C</p>
                  </div>
                  <div className="stat-card">
                    <h4>Temperatura Máxima</h4>
                    <p className="stat-value">{climateResult.max_temperature}°C</p>
                  </div>
                  <div className="stat-card">
                    <h4>Temperatura Mínima</h4>
                    <p className="stat-value">{climateResult.min_temperature}°C</p>
                  </div>
                  <div className="stat-card">
                    <h4>Temperatura Final</h4>
                    <p className="stat-value">{climateResult.final_temperature}°C</p>
                  </div>
                </div>

                <p className="interpretation">
                  <strong>Interpretación:</strong> {climateResult.interpretation}
                </p>

                {climateResult.forecast_data && (
                  <div className="chart-container">
                    <h4>📊 Tendencia de Temperatura</h4>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={climateResult.forecast_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            formatter={(value) => {
                              if (typeof value === "number") return value.toFixed(2);
                              return value;
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="temperature"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            name="Temperatura"
                          />
                          <Line
                            type="monotone"
                            dataKey="trend_only"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                            name="Tendencia"
                          />
                        </ComposedChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* EPIDEMIOLOGY TAB */}
      {activeTab === "epidemiology" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>Modelo Epidemiológico (SEIR)</h2>
            <p>Simula la propagación de enfermedades: Susceptible → Expuesto → Infectado → Recuperado</p>

            <form onSubmit={handleEpidemiologyModel} className="input-form">
              <div className="form-section">
                <label>Población Susceptible</label>
                <input
                  type="number"
                  value={epidemiologySusceptible}
                  onChange={(e) => setEpidemiologySusceptible(parseInt(e.target.value))}
                  step="100"
                />
              </div>

              <div className="form-section">
                <label>Infectados Iniciales</label>
                <input
                  type="number"
                  value={epidemiologyInfected}
                  onChange={(e) => setEpidemiologyInfected(parseInt(e.target.value))}
                  step="1"
                />
              </div>

              <div className="form-section">
                <label>Expuestos Iniciales</label>
                <input
                  type="number"
                  value={epidemiologyExposed}
                  onChange={(e) => setEpidemiologyExposed(parseInt(e.target.value))}
                  step="1"
                />
              </div>

              <div className="form-section">
                <label>Recuperados Iniciales</label>
                <input
                  type="number"
                  value={epidemiologyRecovered}
                  onChange={(e) => setEpidemiologyRecovered(parseInt(e.target.value))}
                  step="1"
                />
              </div>

              <div className="form-section">
                <label>Tasa de Transmisión (β)</label>
                <input
                  type="number"
                  value={epidemiologyTransmissionRate}
                  onChange={(e) => setEpidemiologyTransmissionRate(parseFloat(e.target.value))}
                  step="0.0001"
                  placeholder="0.0005"
                />
              </div>

              <div className="form-section">
                <label>Tasa de Recuperación (γ)</label>
                <input
                  type="number"
                  value={epidemiologyRecoveryRate}
                  onChange={(e) => setEpidemiologyRecoveryRate(parseFloat(e.target.value))}
                  step="0.01"
                  placeholder="0.1"
                />
              </div>

              <div className="form-section">
                <label>Días a Simular</label>
                <input
                  type="number"
                  value={epidemiologyDays}
                  onChange={(e) => setEpidemiologyDays(parseInt(e.target.value))}
                  step="30"
                />
              </div>

              <button type="submit" className="submit-btn" disabled={loading}>
                <span>{loading ? "⏳" : "🦠"}</span>
                {loading ? "Simulando..." : "Ejecutar Modelo SEIR"}
              </button>
            </form>

            {epidemiologyResult && (
              <div className="result-section">
                <h3>🦠 Resultado del Modelo Epidemiológico</h3>
                <div className="epidemic-stats">
                  <div className="stat-card">
                    <h4>Pico de Infectados</h4>
                    <p className="stat-value">{epidemiologyResult.peak_infected}</p>
                    <p className="stat-subtext">Día {epidemiologyResult.peak_day}</p>
                  </div>
                  <div className="stat-card">
                    <h4>Total Infectados</h4>
                    <p className="stat-value">{epidemiologyResult.total_infected}</p>
                  </div>
                </div>

                <p className="interpretation">
                  <strong>Interpretación:</strong> {epidemiologyResult.interpretation}
                </p>

                {epidemiologyResult.simulation_data && (
                  <div className="chart-container">
                    <h4>📈 Evolución de Compartimentos SEIR</h4>
                    <div className="chart-wrapper">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={epidemiologyResult.simulation_data}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="day" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip
                            formatter={(value) => {
                              if (typeof value === "number") return value.toLocaleString();
                              return value;
                            }}
                            contentStyle={{
                              backgroundColor: "white",
                              border: "1px solid #e5e7eb",
                              borderRadius: "8px",
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="susceptible"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={false}
                            name="Susceptible"
                          />
                          <Line
                            type="monotone"
                            dataKey="exposed"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={false}
                            name="Expuesto"
                          />
                          <Line
                            type="monotone"
                            dataKey="infected"
                            stroke="#ef4444"
                            strokeWidth={2}
                            dot={false}
                            name="Infectado"
                          />
                          <Line
                            type="monotone"
                            dataKey="recovered"
                            stroke="#10b981"
                            strokeWidth={2}
                            dot={false}
                            name="Recuperado"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADVANCED MODELS TAB */}
      {activeTab === "advanced" && (
        <div className="tab-content">
          <div className="tab-panel">
            <h2>🚀 Análisis Avanzado de Modelos</h2>
            <p>Simulaciones estocásticas, análisis de sensibilidad y comparación de escenarios.</p>

            {predefinedModels && (
              <div className="models-overview">
                <h3>📚 Modelos Disponibles</h3>
                <div className="models-grid">
                  {predefinedModels.models.map((model) => (
                    <div key={model.id} className="model-card">
                      <h4>{model.name}</h4>
                      <p>{model.description}</p>
                      <p className="variables">Variables: {model.variables.join(", ")}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="advanced-analysis">
              {/* Único bloque de "Simulación Predefinida" — se eliminó la versión
                  vieja duplicada que tenías más abajo, que usaba un <select> con
                  opciones hardcodeadas y no respetaba las condiciones iniciales
                  ni parámetros dinámicos del modelo seleccionado. */}
              <div className="analysis-section">
                <h3>Simulación Predefinida</h3>
                <form onSubmit={handlePredefinedModel}>
                  <div className="form-section">
                    <label>Modelo</label>
                    <select value={selectedModel} onChange={(e) => setSelectedModel(e.target.value)}>
                      {predefinedModels?.models.map((m) => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                  </div>

                  {currentModelInfo && (
                    <>
                      <div className="form-section">
                        <label>Condiciones iniciales</label>
                        {currentModelInfo.variables.map((varName, i) => (
                          <div key={varName} className="variable-input">
                            <label>{varName} =</label>
                            <input
                              type="number"
                              value={currentInitialConditions[i] ?? 0}
                              onChange={(e) => {
                                const next = [...currentInitialConditions];
                                next[i] = parseFloat(e.target.value);
                                setCurrentInitialConditions(next);
                              }}
                            />
                          </div>
                        ))}
                      </div>

                      <div className="form-section">
                        <label>Parámetros</label>
                        {Object.entries(currentParameters).map(([key, value]) => (
                          <div key={key} className="variable-input">
                            <label>{key.replace(/_/g, " ")} =</label>
                            <input
                              type="number"
                              step="any"
                              value={value}
                              onChange={(e) =>
                                setCurrentParameters((prev) => ({ ...prev, [key]: parseFloat(e.target.value) }))
                              }
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}

                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Simulando..." : "Simular Modelo"}
                  </button>
                </form>

                {predefinedResult && (
                  <div className="result-section">
                    <h4>Resultado de Simulación</h4>
                    <p>{predefinedResult.interpretation}</p>
                    {predefinedResult.simulation_data && predefinedResult.simulation_data.length > 0 && (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={predefinedResult.simulation_data.map((d) => {
                              const row: Record<string, number> = { time: d.time };
                              currentModelInfo?.variables.forEach((varName, i) => {
                                row[varName] = d.values[`var_${i}`];
                              });
                              return row;
                            })}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            {currentModelInfo?.variables.map((varName, i) => (
                              <Line
                                key={varName}
                                type="monotone"
                                dataKey={varName}
                                stroke={["#3b82f6", "#ef4444", "#10b981", "#f59e0b"][i % 4]}
                                dot={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="analysis-section">
                <h3>Análisis de Sensibilidad</h3>
                <form onSubmit={handleSensitivityAnalysis2}>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Analizando..." : "Análisis de Sensibilidad"}
                  </button>
                </form>

                {sensResult2 && (
                  <div className="result-section">
                    <h4>Resultado de Sensibilidad</h4>
                    <p>{sensResult2.interpretation}</p>
                    {sensResult2.sensitivity_data && (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart
                            data={sensResult2.sensitivity_data}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="parameter_value" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="final_output" stroke="#ef4444" />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="analysis-section">
                <h3>Simulación Estocástica</h3>
                <form onSubmit={handleStochasticSimulation}>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Simulando..." : "Ejecutar Simulación Estocástica"}
                  </button>
                </form>

                {stochasticResult && (
                  <div className="result-section">
                    <h4>Resultado Estocástico</h4>
                    <p>{stochasticResult.interpretation}</p>
                    <div className="stat-card">
                      <p>Simulaciones: {stochasticResult.num_simulations}</p>
                      <p>Ruido de parámetros: {(stochasticResult.parameter_noise * 100).toFixed(1)}%</p>
                      <p>Ruido de medición: {(stochasticResult.measurement_noise * 100).toFixed(1)}%</p>
                    </div>
                    {stochasticResult.statistics_data && (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <ComposedChart data={stochasticResult.statistics_data}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="mean" stroke="#3b82f6" strokeWidth={2} />
                            <Line type="monotone" dataKey="percentile_5" stroke="#9ca3af" strokeWidth={1} strokeDasharray="5 5" />
                            <Line type="monotone" dataKey="percentile_95" stroke="#9ca3af" strokeWidth={1} strokeDasharray="5 5" />
                          </ComposedChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="analysis-section">
                <h3>Comparación de Escenarios</h3>
                <form onSubmit={handleScenarioComparison}>
                  <button type="submit" className="submit-btn" disabled={loading}>
                    {loading ? "Comparando..." : "Comparar Escenarios"}
                  </button>
                </form>

                {scenarioResult && (
                  <div className="result-section">
                    <h4>Comparación de Escenarios</h4>
                    <p>{scenarioResult.interpretation}</p>
                    <div className="scenarios-stats">
                      {scenarioResult.scenarios.map((scenario, idx) => (
                        <div key={idx} className="stat-card">
                          <h5>{scenario.scenario_name}</h5>
                          <p className="stat-value">{scenario.final_value.toFixed(2)}</p>
                        </div>
                      ))}
                    </div>
                    {scenarioResult.scenarios.length > 0 && (
                      <div className="chart-container">
                        <ResponsiveContainer width="100%" height={300}>
                          <LineChart>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="time" />
                            <YAxis />
                            <Tooltip />
                            {scenarioResult.scenarios.map((scenario, idx) => (
                              <Line
                                key={idx}
                                type="monotone"
                                dataKey="value"
                                data={scenario.data}
                                stroke={["#3b82f6", "#ef4444", "#10b981", "#f59e0b"][idx]}
                                name={scenario.scenario_name}
                                strokeWidth={2}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}