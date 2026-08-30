import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { calculateLimit, type LimitResponse } from "../api/client";
import MathDisplay from "../components/MathDisplay";

export default function LimitLab() {
  const [expression, setExpression] = useState("sin(x)/x");
  const [point, setPoint] = useState("0");
  const [result, setResult] = useState<LimitResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await calculateLimit(expression, point);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo calcular el límite");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <Link to="/dashboard">&larr; Volver al dashboard</Link>
      <h1>Laboratorio de Límites</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Ej: sin(x)/x"
          style={{ flex: 1, padding: 8, minWidth: 200 }}
        />
        <span style={{ alignSelf: "center" }}>cuando x →</span>
        <input
          value={point}
          onChange={(e) => setPoint(e.target.value)}
          placeholder="0, oo, -oo"
          style={{ width: 100, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Calculando..." : "Calcular"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          <MathDisplay
            latex={`\\lim_{x \\to ${point}} ${result.original_latex} = ${result.result_latex}`}
            block
          />
          {!result.exists && (
            <p style={{ color: "#b45309" }}>Los límites laterales son distintos, el límite no existe.</p>
          )}
        </div>
      )}
    </div>
  );
}