import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { calculateIntegral, type IntegralResponse } from "../api/client";
import MathDisplay from "../components/MathDisplay";
import "../styles/IntegralLab.css";

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

  const isDefinite = lower.trim() !== "" && upper.trim() !== "";

  return (
    <div className="integral-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>Laboratorio de Integrales</h1>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-field">
            <label htmlFor="expression">Función (f(x))</label>
            <input
              id="expression"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ej: x**2, sin(x), exp(x)"
              type="text"
            />
          </div>
          <div className="form-field">
            <label htmlFor="lower">Límite Inferior (opcional)</label>
            <input
              id="lower"
              value={lower}
              onChange={(e) => setLower(e.target.value)}
              placeholder="Ej: 0"
              type="text"
            />
          </div>
          <div className="form-field">
            <label htmlFor="upper">Límite Superior (opcional)</label>
            <input
              id="upper"
              value={upper}
              onChange={(e) => setUpper(e.target.value)}
              placeholder="Ej: 5"
              type="text"
            />
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? "⏳" : "∫"}</span>
            {loading ? "Calculando..." : "Integrar"}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className={`result-card ${isDefinite ? "definite" : "indefinite"}`}>
          <div className={`integral-type ${isDefinite ? "definite" : "indefinite"}`}>
            <span>{isDefinite ? "✓ Integral Definida" : "✓ Integral Indefinida"}</span>
          </div>
          
          <div className={`result-content ${isDefinite ? "definite" : "indefinite"}`}>
            {isDefinite ? (
              <MathDisplay
                latex={`\\int_{${lower}}^{${upper}} ${result.original_latex}\\, dx = ${result.result_latex}`}
                block
              />
            ) : (
              <>
                <MathDisplay
                  latex={`\\int ${result.original_latex}\\, dx = ${result.result_latex} + C`}
                  block
                />
                <div className="constant-note">
                  📝 Nota: C es la constante de integración
                </div>
              </>
            )}
          </div>

          {isDefinite && (
            <div className="result-details" style={{ marginTop: "var(--spacing-lg)" }}>
              <div className="detail-item">
                <strong>Límite Inferior</strong>
                <span>{lower}</span>
              </div>
              <div className="detail-item">
                <strong>Límite Superior</strong>
                <span>{upper}</span>
              </div>
              <div className="detail-item">
                <strong>Tipo</strong>
                <span>Integral Definida</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}