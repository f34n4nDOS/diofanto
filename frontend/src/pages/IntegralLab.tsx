import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { calculateIntegral, type IntegralResponse } from "../api/client";
import MathDisplay from "../components/MathDisplay";

export default function IntegralLab() {
  const [expression, setExpression] = useState("x**2");
  const [lower, setLower] = useState("");
  const [upper, setUpper] = useState("");
  const [result, setResult] = useState<IntegralResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await calculateIntegral(expression, "x", lower, upper);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo calcular la integral");
      setResult(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "40px auto", padding: "0 16px" }}>
      <Link to="/dashboard">&larr; Volver al dashboard</Link>
      <h1>Laboratorio de Integrales</h1>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        <input
          value={expression}
          onChange={(e) => setExpression(e.target.value)}
          placeholder="Ej: x**2"
          style={{ flex: 1, padding: 8, minWidth: 200 }}
        />
        <input
          value={lower}
          onChange={(e) => setLower(e.target.value)}
          placeholder="límite inf. (opcional)"
          style={{ width: 150, padding: 8 }}
        />
        <input
          value={upper}
          onChange={(e) => setUpper(e.target.value)}
          placeholder="límite sup. (opcional)"
          style={{ width: 150, padding: 8 }}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Calculando..." : "Integrar"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <div>
          {result.is_definite ? (
            <MathDisplay
              latex={`\\int_{${lower}}^{${upper}} ${result.original_latex}\\, dx = ${result.result_latex}`}
              block
            />
          ) : (
            <MathDisplay
              latex={`\\int ${result.original_latex}\\, dx = ${result.result_latex} + C`}
              block
            />
          )}
        </div>
      )}
    </div>
  );
}