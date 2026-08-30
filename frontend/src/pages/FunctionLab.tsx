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
    <div style={{ maxWidth: 720, margin: "40px auto", padding: "0 16px" }}>
      <Link to="/dashboard">&larr; Volver al dashboard</Link>
      <h1>Laboratorio de Funciones</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Ej: x**2 - 4, sin(x), 1/x"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Calculando..." : "Graficar"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {plotData && (
        <div style={{ marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={plotData.points}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} />
              <YAxis />
              <Tooltip formatter={(value: number) => value.toFixed(3)} />
              <ReferenceLine y={0} stroke="#888" />
              <ReferenceLine x={0} stroke="#888" />
              <Line type="monotone" dataKey="y" stroke="#2563eb" dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
          {plotData.domain_note && (
            <p style={{ fontSize: 13, color: "#888" }}>{plotData.domain_note}</p>
          )}
        </div>
      )}

      {derivative && (
  <div>
    <h2>Derivada</h2>
    <p>
      <MathDisplay latex={`f(x) = ${derivative.original_latex} \\Rightarrow f'(x) = ${derivative.result_simplified_latex}`} block />
    </p>
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
  );
}