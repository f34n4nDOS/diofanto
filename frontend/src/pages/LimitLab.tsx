import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { calculateLimit, type LimitResponse } from "../api/client";
import MathDisplay from "../components/MathDisplay";
import "../styles/LimitLab.css";

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

  const getPointDisplay = (p: string) => {
    if (p === "oo" || p === "∞") return "∞";
    if (p === "-oo" || p === "-∞") return "-∞";
    return p;
  };

  return (
    <div className="limit-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>Laboratorio de Límites</h1>

      <form className="input-form" onSubmit={handleSubmit}>
        <div className="form-section">
          <div className="form-field">
            <label htmlFor="expression">Función (f(x))</label>
            <input
              id="expression"
              value={expression}
              onChange={(e) => setExpression(e.target.value)}
              placeholder="Ej: sin(x)/x, (x**2 - 1)/(x - 1)"
              type="text"
            />
          </div>
          <div className="arrow-separator">lim</div>
          <div className="form-field">
            <label htmlFor="point">Cuando x → </label>
            <input
              id="point"
              value={point}
              onChange={(e) => setPoint(e.target.value)}
              placeholder="0, oo, -oo"
              type="text"
            />
            <div className="helper-text">Usa 'oo' para ∞</div>
          </div>
          <button type="submit" className="submit-btn" disabled={loading}>
            <span>{loading ? "⏳" : "📈"}</span>
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (
        <div className={`result-card ${result.exists ? "exists" : "not-exists"}`}>
          <div className="result-content">
            <MathDisplay
              latex={`\\lim_{x \\to ${getPointDisplay(point)}} ${result.original_latex} = ${result.result_latex}`}
              block
            />
          </div>

          {result.exists ? (
            <div className="limit-exists-note">
              ✓ El límite existe y es finito
            </div>
          ) : (
            <div className="limit-not-exists-note">
              ⚠️ Los límites laterales son distintos, el límite no existe en este punto.
            </div>
          )}

          {result.left_limit !== undefined && result.right_limit !== undefined && (
            <div className="limit-details">
              <h3>Análisis de Límites Laterales</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
                <div>
                  <strong>Límite por la izquierda</strong>
                  <p>
                    <MathDisplay
                      latex={`\\lim_{x \\to ${getPointDisplay(point)}^-} f(x) = ${result.left_limit}`}
                      block={false}
                    />
                  </p>
                </div>
                <div>
                  <strong>Límite por la derecha</strong>
                  <p>
                    <MathDisplay
                      latex={`\\lim_{x \\to ${getPointDisplay(point)}^+} f(x) = ${result.right_limit}`}
                      block={false}
                    />
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}