import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  ComposedChart,
  Scatter,
  Line,
  LineChart,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import api from "../api/client";
import MathDisplay from "../components/MathDisplay";
// Reusamos las clases visuales de ModelingLab (tabs, formularios, tarjetas
// de resultado) para mantener el mismo lenguaje visual en todo el sitio.
import "../styles/ModelingLab.css";

type Tab = "regression" | "neural-network" | "language-model";

/* ============================================================
   TIPOS (coinciden con los schemas del backend)
   ============================================================ */

interface RegressionPoint {
  x: number;
  y: number;
}

interface RegressionResponse {
  points: RegressionPoint[];
  fitted_curve: RegressionPoint[];
  coefficients: number[];
  equation_str: string;
  equation_latex: string;
  r_squared: number;
  mse: number;
  interpretation: string;
}

interface ClassifierPoint {
  x: number;
  y: number;
  label: number;
}

interface GridPoint {
  x: number;
  y: number;
  probability: number;
}

interface NeuralNetworkResponse {
  points: ClassifierPoint[];
  decision_boundary: GridPoint[];
  accuracy: number;
  loss_curve: number[];
  interpretation: string;
}

interface NextWordPrediction {
  word: string;
  probability: number;
}

interface LanguageModelResponse {
  corpus_word_count: number;
  vocabulary_size: number;
  n: number;
  next_word_predictions: NextWordPrediction[];
  generated_text: string;
  interpretation: string;
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function MLLab() {
  const [activeTab, setActiveTab] = useState<Tab>("regression");

  return (
    <div className="modeling-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>🤖 Laboratorio de IA</h1>
      <p className="lab-subtitle">
        Entrená mini-modelos reales (no simulados) y mirá qué pasa por dentro: cómo ajustan, cómo
        aprenden, y cómo predicen.
      </p>

      <div className="tabs">
        <button className={`tab ${activeTab === "regression" ? "active" : ""}`} onClick={() => setActiveTab("regression")}>
          📉 Regresión
        </button>
        <button className={`tab ${activeTab === "neural-network" ? "active" : ""}`} onClick={() => setActiveTab("neural-network")}>
          🧠 Red Neuronal
        </button>
        <button className={`tab ${activeTab === "language-model" ? "active" : ""}`} onClick={() => setActiveTab("language-model")}>
          💬 Modelo de Lenguaje
        </button>
      </div>

      {activeTab === "regression" && <RegressionTab />}
      {activeTab === "neural-network" && <NeuralNetworkTab />}
      {activeTab === "language-model" && <LanguageModelTab />}
    </div>
  );
}

/* ============================================================
   TAB 1 — REGRESIÓN
   ============================================================ */

function RegressionTab() {
  const [mode, setMode] = useState<"synthetic" | "custom">("synthetic");
  const [trueFunction, setTrueFunction] = useState("linear");
  const [noise, setNoise] = useState(1.5);
  const [numPoints, setNumPoints] = useState(30);
  const [degree, setDegree] = useState(1);
  const [customPointsText, setCustomPointsText] = useState("0,1\n1,3\n2,4.5\n3,8\n4,9.5");

  const [result, setResult] = useState<RegressionResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function parseCustomPoints(): RegressionPoint[] | null {
    try {
      const lines = customPointsText.split("\n").map((l) => l.trim()).filter(Boolean);
      const points = lines.map((line) => {
        const [x, y] = line.split(",").map((v) => parseFloat(v.trim()));
        if (Number.isNaN(x) || Number.isNaN(y)) throw new Error();
        return { x, y };
      });
      if (points.length < 2) throw new Error();
      return points;
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const body: Record<string, unknown> = { degree };
      if (mode === "custom") {
        const points = parseCustomPoints();
        if (!points) {
          setError("Revisá el formato: una línea por punto, como 'x,y' (ej: 2,4.5)");
          setLoading(false);
          return;
        }
        body.points = points;
      } else {
        body.true_function = trueFunction;
        body.noise = noise;
        body.num_synthetic_points = numPoints;
      }
      const res = await api.post<RegressionResponse>("/api/mllab/regression", body);
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo ajustar el modelo");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Combinamos los puntos reales y la curva ajustada en un solo dataset
  // por 'x' para que ComposedChart pueda dibujar ambos alineados.
  const chartData = result
    ? [
        ...result.points.map((p) => ({ x: p.x, observado: p.y })),
        ...result.fitted_curve.map((p) => ({ x: p.x, ajuste: p.y })),
      ].sort((a, b) => a.x - b.x)
    : [];

  return (
    <div className="tab-content">
      <div className="tab-panel">
        <h2>Regresión: ajustando una curva a datos</h2>
        <p>Elegí datos sintéticos o pegá los tuyos, y mirá cómo el grado del polinomio cambia el ajuste.</p>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-section">
            <label>Origen de los datos</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as "synthetic" | "custom")} className="select-input">
              <option value="synthetic">Generar datos sintéticos</option>
              <option value="custom">Pegar mis propios puntos</option>
            </select>
          </div>

          {mode === "synthetic" ? (
            <>
              <div className="form-section">
                <label>Función real detrás de los datos</label>
                <select value={trueFunction} onChange={(e) => setTrueFunction(e.target.value)} className="select-input">
                  <option value="linear">Lineal (y = 2x + 1)</option>
                  <option value="quadratic">Cuadrática (y = 0.5x² - 2x + 3)</option>
                  <option value="sine">Ondulada (y = 5·sin(x) + 0.3x)</option>
                </select>
              </div>
              <div className="form-section">
                <label>Ruido (variabilidad aleatoria)</label>
                <input type="number" step="0.1" min="0" value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} />
              </div>
              <div className="form-section">
                <label>Cantidad de puntos</label>
                <input type="number" min="5" max="200" value={numPoints} onChange={(e) => setNumPoints(parseInt(e.target.value))} />
              </div>
            </>
          ) : (
            <div className="form-section">
              <label>Tus puntos (uno por línea, formato x,y)</label>
              <textarea
                value={customPointsText}
                onChange={(e) => setCustomPointsText(e.target.value)}
                rows={6}
                placeholder={"0,1\n1,3\n2,4.5"}
              />
            </div>
          )}

          <div className="form-section">
            <label>Grado del polinomio: {degree} {degree === 1 ? "(lineal)" : ""}</label>
            <input type="range" min="1" max="8" value={degree} onChange={(e) => setDegree(parseInt(e.target.value))} />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? "⏳" : "📉"}</span>
            {loading ? "Ajustando..." : "Ajustar modelo"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result-section">
            <MathDisplay latex={`f(x) = ${result.equation_latex}`} block />

            <div className="simulation-stats">
              <div className="stat-card">
                <h4>R²</h4>
                <p className="stat-value">{result.r_squared.toFixed(4)}</p>
              </div>
              <div className="stat-card">
                <h4>Error cuadrático medio</h4>
                <p className="stat-value">{result.mse.toFixed(4)}</p>
              </div>
            </div>

            <p className="interpretation">
              <strong>Interpretación:</strong> {result.interpretation}
            </p>

            <div className="chart-container">
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(3) : v)} />
                    <Scatter dataKey="observado" fill="#3b82f6" name="Datos" />
                    <Line dataKey="ajuste" stroke="#ef4444" strokeWidth={2} dot={false} name="Ajuste" isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 2 — RED NEURONAL
   ============================================================ */

function NeuralNetworkTab() {
  const [mode, setMode] = useState<"synthetic" | "custom">("synthetic");
  const [datasetType, setDatasetType] = useState("moons");
  const [numPoints, setNumPoints] = useState(150);
  const [noise, setNoise] = useState(0.2);
  const [hiddenLayersText, setHiddenLayersText] = useState("8,8");
  const [epochs, setEpochs] = useState(200);
  const [learningRate, setLearningRate] = useState(0.01);
  const [customPointsText, setCustomPointsText] = useState(
    "0,0,0\n0,1,1\n1,0,1\n1,1,0\n0.1,0.1,0\n0.9,0.9,0\n0.1,0.9,1\n0.9,0.1,1"
  );

  const [result, setResult] = useState<NeuralNetworkResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function parseCustomPoints(): ClassifierPoint[] | null {
    try {
      const lines = customPointsText.split("\n").map((l) => l.trim()).filter(Boolean);
      const points = lines.map((line) => {
        const [x, y, label] = line.split(",").map((v) => parseFloat(v.trim()));
        if (Number.isNaN(x) || Number.isNaN(y) || (label !== 0 && label !== 1)) throw new Error();
        return { x, y, label };
      });
      if (points.length < 4) throw new Error();
      return points;
    } catch {
      return null;
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const hiddenLayers = hiddenLayersText
        .split(",")
        .map((v) => parseInt(v.trim()))
        .filter((v) => !Number.isNaN(v) && v > 0);

      if (hiddenLayers.length === 0) {
        setError("Ingresá al menos una capa oculta, ej: 8,8");
        setLoading(false);
        return;
      }

      const body: Record<string, unknown> = {
        hidden_layer_sizes: hiddenLayers,
        epochs,
        learning_rate: learningRate,
      };

      if (mode === "custom") {
        const points = parseCustomPoints();
        if (!points) {
          setError("Revisá el formato: una línea por punto, como 'x,y,label' con label 0 o 1");
          setLoading(false);
          return;
        }
        body.points = points;
      } else {
        body.dataset_type = datasetType;
        body.num_synthetic_points = numPoints;
        body.noise = noise;
      }

      const res = await api.post<NeuralNetworkResponse>("/api/mllab/neural-network", body);
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo entrenar la red");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  // Frontera de decisión: la pintamos "detrás" de los datos como dos
  // nubes de puntos tenues (una por clase predicha), y encima los datos
  // reales bien marcados.
  const boundaryClass0 = result?.decision_boundary.filter((p) => p.probability < 0.5) ?? [];
  const boundaryClass1 = result?.decision_boundary.filter((p) => p.probability >= 0.5) ?? [];
  const dataClass0 = result?.points.filter((p) => p.label === 0) ?? [];
  const dataClass1 = result?.points.filter((p) => p.label === 1) ?? [];

  const lossData = result?.loss_curve.map((loss, i) => ({ epoch: i + 1, loss })) ?? [];

  return (
    <div className="tab-content">
      <div className="tab-panel">
        <h2>Red neuronal: clasificando puntos en el plano</h2>
        <p>Una red neuronal chica aprende a separar dos clases de puntos. Mirá cómo cambia la frontera según la arquitectura.</p>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-section">
            <label>Origen de los datos</label>
            <select value={mode} onChange={(e) => setMode(e.target.value as "synthetic" | "custom")} className="select-input">
              <option value="synthetic">Generar datos sintéticos</option>
              <option value="custom">Pegar mis propios puntos</option>
            </select>
          </div>

          {mode === "synthetic" ? (
            <>
              <div className="form-section">
                <label>Forma del patrón</label>
                <select value={datasetType} onChange={(e) => setDatasetType(e.target.value)} className="select-input">
                  <option value="moons">Dos medialunas (no separable con una línea)</option>
                  <option value="circles">Círculos concéntricos</option>
                  <option value="xor">XOR (el clásico "imposible" para un modelo lineal)</option>
                  <option value="linear">Separable con una línea</option>
                </select>
              </div>
              <div className="form-section">
                <label>Cantidad de puntos</label>
                <input type="number" min="20" max="300" value={numPoints} onChange={(e) => setNumPoints(parseInt(e.target.value))} />
              </div>
              <div className="form-section">
                <label>Ruido</label>
                <input type="number" step="0.05" min="0" max="1" value={noise} onChange={(e) => setNoise(parseFloat(e.target.value))} />
              </div>
            </>
          ) : (
            <div className="form-section">
              <label>Tus puntos (uno por línea, formato x,y,label — label es 0 o 1)</label>
              <textarea
                value={customPointsText}
                onChange={(e) => setCustomPointsText(e.target.value)}
                rows={6}
              />
            </div>
          )}

          <div className="form-section">
            <label>Capas ocultas (neuronas por capa, separadas por coma)</label>
            <input value={hiddenLayersText} onChange={(e) => setHiddenLayersText(e.target.value)} placeholder="8,8" />
          </div>

          <div className="form-section">
            <label>Épocas de entrenamiento: {epochs}</label>
            <input type="range" min="10" max="500" step="10" value={epochs} onChange={(e) => setEpochs(parseInt(e.target.value))} />
          </div>

          <div className="form-section">
            <label>Tasa de aprendizaje</label>
            <input type="number" step="0.001" min="0.0001" max="1" value={learningRate} onChange={(e) => setLearningRate(parseFloat(e.target.value))} />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? "⏳" : "🧠"}</span>
            {loading ? "Entrenando..." : "Entrenar red"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result-section">
            <div className="simulation-stats">
              <div className="stat-card">
                <h4>Precisión en entrenamiento</h4>
                <p className="stat-value">{(result.accuracy * 100).toFixed(1)}%</p>
              </div>
              <div className="stat-card">
                <h4>Épocas entrenadas</h4>
                <p className="stat-value">{result.loss_curve.length}</p>
              </div>
            </div>

            <p className="interpretation">
              <strong>Interpretación:</strong> {result.interpretation}
            </p>

            <div className="chart-container">
              <h4>🗺️ Frontera de decisión</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} stroke="#6b7280" />
                    <YAxis dataKey="y" type="number" domain={["dataMin", "dataMax"]} stroke="#6b7280" />
                    <Tooltip />
                    <Scatter data={boundaryClass0} fill="#bfdbfe" fillOpacity={0.5} name="Zona clase 0" legendType="none" />
                    <Scatter data={boundaryClass1} fill="#fecaca" fillOpacity={0.5} name="Zona clase 1" legendType="none" />
                    <Scatter data={dataClass0} fill="#2563eb" name="Clase 0" />
                    <Scatter data={dataClass1} fill="#dc2626" name="Clase 1" />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="chart-container">
              <h4>📉 Pérdida durante el entrenamiento</h4>
              <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lossData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="epoch" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip formatter={(v) => (typeof v === "number" ? v.toFixed(4) : v)} />
                    <Line type="monotone" dataKey="loss" stroke="#7c3aed" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   TAB 3 — MODELO DE LENGUAJE
   ============================================================ */

function LanguageModelTab() {
  const [corpus, setCorpus] = useState("");
  const [n, setN] = useState(2);
  const [prompt, setPrompt] = useState("");
  const [numWords, setNumWords] = useState(20);
  const [temperature, setTemperature] = useState(1.0);

  const [result, setResult] = useState<LanguageModelResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post<LanguageModelResponse>("/api/mllab/language-model", {
        corpus: corpus.trim() || null,
        n,
        prompt,
        num_words_to_generate: numWords,
        temperature,
      });
      setResult(res.data);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo entrenar el modelo de lenguaje");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  const barData = result?.next_word_predictions.map((p) => ({ palabra: p.word, probabilidad: p.probability })) ?? [];

  return (
    <div className="tab-content">
      <div className="tab-panel">
        <h2>Modelo de lenguaje: prediciendo la palabra siguiente</h2>
        <p>
          Un modelo de n-gramas cuenta qué palabras siguen a qué contextos en un texto, y arma una
          distribución de probabilidad con eso — la misma idea central detrás de los LLM modernos,
          aunque ellos usan una red neuronal en vez de simplemente contar.
        </p>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="form-section">
            <label>Texto de entrenamiento (dejalo vacío para usar uno de ejemplo)</label>
            <textarea
              value={corpus}
              onChange={(e) => setCorpus(e.target.value)}
              rows={6}
              placeholder="Pegá acá el texto con el que querés entrenar el modelo..."
            />
          </div>

          <div className="form-section">
            <label>Tamaño del n-grama: {n} {n === 2 ? "(bigrama)" : n === 3 ? "(trigrama)" : ""}</label>
            <input type="range" min="2" max="4" value={n} onChange={(e) => setN(parseInt(e.target.value))} />
          </div>

          <div className="form-section">
            <label>Contexto / prompt (últimas {n - 1} palabra(s) importan)</label>
            <input value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Ej: la matemática" type="text" />
          </div>

          <div className="form-section">
            <label>Palabras a generar</label>
            <input type="number" min="1" max="60" value={numWords} onChange={(e) => setNumWords(parseInt(e.target.value))} />
          </div>

          <div className="form-section">
            <label>Temperatura: {temperature.toFixed(2)} {temperature < 0.5 ? "(conservador)" : temperature > 1.5 ? "(muy aleatorio)" : ""}</label>
            <input type="range" min="0.1" max="2" step="0.1" value={temperature} onChange={(e) => setTemperature(parseFloat(e.target.value))} />
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? "⏳" : "💬"}</span>
            {loading ? "Entrenando..." : "Entrenar y predecir"}
          </button>
        </form>

        {error && <div className="error">{error}</div>}

        {result && (
          <div className="result-section">
            <div className="simulation-stats">
              <div className="stat-card">
                <h4>Palabras en el corpus</h4>
                <p className="stat-value">{result.corpus_word_count}</p>
              </div>
              <div className="stat-card">
                <h4>Vocabulario único</h4>
                <p className="stat-value">{result.vocabulary_size}</p>
              </div>
              <div className="stat-card">
                <h4>N-grama usado</h4>
                <p className="stat-value">{result.n}</p>
              </div>
            </div>

            <p className="interpretation">
              <strong>Interpretación:</strong> {result.interpretation}
            </p>

            {barData.length > 0 && (
              <div className="chart-container">
                <h4>📊 Probabilidad de la palabra siguiente</h4>
                <div className="chart-wrapper">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" domain={[0, 1]} stroke="#6b7280" />
                      <YAxis type="category" dataKey="palabra" stroke="#6b7280" width={90} />
                      <Tooltip formatter={(v) => (typeof v === "number" ? `${(v * 100).toFixed(1)}%` : v)} />
                      <Bar dataKey="probabilidad" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="math-panel">
              <strong>Texto generado:</strong>
              <p style={{ marginTop: 8, fontStyle: "italic" }}>"{result.generated_text}"</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}