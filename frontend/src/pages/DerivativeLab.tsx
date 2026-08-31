import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceLine, ReferenceDot, ResponsiveContainer, Legend,
} from "recharts";
import {
  plotFunction, getDerivative, calculateTangentLine,
  type DerivativeResponse, type TangentLineResponse,
} from "../api/client";
import MathDisplay from "../components/MathDisplay";

interface ChartPoint {
  x: number;
  f?: number;
  fprime?: number;
  tangent?: number;
}

export default function DerivativeLab() {
  const [expression, setExpression] = useState("x**3 - 3*x");
  const [pointX, setPointX] = useState("2");
  const [derivative, setDerivative] = useState<DerivativeResponse | null>(null);
  const [tangent, setTangent] = useState<TangentLineResponse | null>(null);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleAnalyze(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setTangent(null);
    try {
      const deriv = await getDerivative(expression);
      setDerivative(deriv);

      const xMin = -10, xMax = 10;
      const [fPlot, fPrimePlot] = await Promise.all([
        plotFunction(expression, xMin, xMax),
        plotFunction(deriv.result_simplified, xMin, xMax),
      ]);

      // Combinamos por índice (ambos piden el mismo rango y cantidad de puntos)
      const merged: ChartPoint[] = fPlot.points.map((p, i) => ({
        x: p.x,
        f: p.y,
        fprime: fPrimePlot.points[i]?.y,
      }));
      setChartData(merged);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo analizar la función");
      setDerivative(null);
      setChartData([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleTangent() {
    setError("");
    try {
      const result = await calculateTangentLine(expression, Number(pointX));
      setTangent(result);

      // Agregamos la recta tangente como una tercera serie sobre los mismos puntos x
      setChartData((prev) =>
        prev.map((point) => ({
          ...point,
          tangent: result.slope * point.x + (result.point_y - result.slope * result.point_x),
        }))
      );
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo calcular la tangente");
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: "0 16px" }}>
      <Link to="/dashboard">&larr; Volver al dashboard</Link>
      <h1>Laboratorio de Derivadas</h1>

      <form onSubmit={handleAnalyze} style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Ej: x**3 - 3*x"
          style={{ flex: 1, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Analizando..." : "Analizar"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {chartData.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]} />
              <YAxis />
              <Tooltip formatter={(value: number) => value?.toFixed(3)} />
              <Legend />
              <ReferenceLine y={0} stroke="#888" />
              <ReferenceLine x={0} stroke="#888" />
              <Line name="f(x)" type="monotone" dataKey="f" stroke="#2563eb" dot={false} isAnimationActive={false} />
              <Line name="f'(x)" type="monotone" dataKey="fprime" stroke="#dc2626" dot={false} isAnimationActive={false} />
              {tangent && (
                <Line name="tangente" type="monotone" dataKey="tangent" stroke="#16a34a" strokeDasharray="5 4" dot={false} isAnimationActive={false} />
              )}
              {tangent && (
                <ReferenceDot x={tangent.point_x} y={tangent.point_y} r={5} fill="#16a34a" stroke="none" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {derivative && (
        <div style={{ marginBottom: 24 }}>
          <MathDisplay
            latex={`f(x) = ${derivative.original_latex} \\Rightarrow f'(x) = ${derivative.result_simplified_latex}`}
            block
          />

          {derivative.critical_points.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3>Puntos críticos</h3>
              <ul>
                {derivative.critical_points.map((cp, i) => (
                  <li key={i}>
                    x = {cp.x.toFixed(3)}, f(x) = {cp.y.toFixed(3)} — <strong>{cp.kind}</strong>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {derivative && (
        <div style={{ borderTop: "1px solid #ddd", paddingTop: 16 }}>
          <h3>Recta tangente en un punto</h3>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <label>x =</label>
            <input
              type="number"
              value={pointX}
              onChange={(e) => setPointX(e.target.value)}
              style={{ width: 100, padding: 6 }}
            />
            <button onClick={handleTangent}>Calcular tangente</button>
          </div>
          {tangent && (
            <p style={{ marginTop: 8 }}>
              En x = {tangent.point_x}, la pendiente es <strong>{tangent.slope}</strong> — recta: y = {tangent.slope}x + {(tangent.point_y - tangent.slope * tangent.point_x).toFixed(3)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}