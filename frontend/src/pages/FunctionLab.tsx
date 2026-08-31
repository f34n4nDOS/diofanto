import { useState, type FormEvent } from "react";
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
} from "recharts";
import { plotFunction, getDerivative, type PlotResponse, type DerivativeResponse } from "../api/client";
import MathDisplay from "../components/MathDisplay";
import "../styles/FunctionLab.css";

export default function FunctionLab() {
  const [expression, setExpression] = useState("x**2 - 4");
  const [plotData, setPlotData] = useState<PlotResponse | null>(null);
  const [derivative, setDerivative] = useState<DerivativeResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const [plot, deriv] = await Promise.all([
        plotFunction(expression),
        getDerivative(expression),
      ]);
      setPlotData(plot);
      setDerivative(deriv);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo procesar la expresión");
      setPlotData(null);
      setDerivative(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="function-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>Laboratorio de Funciones</h1>

      <form className="input-form">
        <div className="input-form-group">
          <div className="form-field" style={{ flex: 1 }}>
            <label htmlFor="expression">Función (f(x))</label>
            <input
              id="expression"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ej: x**2 - 4, sin(x), 1/x, exp(x)"
              type="text"
            />
          </div>
          <button 
            type="button" 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={loading}
          >
            <span>{loading ? "⏳" : "📈"}</span>
            {loading ? "Calculando..." : "Graficar"}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {plotData && (
        <div className="chart-container">
          <h2>📊 Gráfico de la Función</h2>
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
                    if (typeof value === 'number') return value.toFixed(3);
                    return value;
                  }}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)"
                  }}
                />
                <ReferenceLine y={0} stroke="#d1d5db" strokeDasharray="5 5" />
                <ReferenceLine x={0} stroke="#d1d5db" strokeDasharray="5 5" />
                <Line 
                  type="monotone" 
                  dataKey="y" 
                  stroke="#2563eb" 
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

      {derivative && (
        <div className="derivative-section">
          <h2>📐 Derivada de la Función</h2>
          <div className="derivative-formula">
            <MathDisplay 
              latex={`f(x) = ${derivative.original_latex}`}
              block 
            />
            <div style={{ textAlign: "center", color: "#6b7280", margin: "12px 0" }}>↓</div>
            <MathDisplay 
              latex={`f'(x) = ${derivative.result_simplified_latex}`}
              block 
            />
          </div>
          
          {derivative.steps.length > 0 && (
            <div className="derivative-steps">
              <h3>Pasos de la Derivación</h3>
              <ol>
                {derivative.steps.map((step, i) => (
                  <li key={i}>
                    {step.description}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </div>
  );
}