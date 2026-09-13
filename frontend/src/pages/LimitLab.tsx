import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { calculateLimit, type LimitResponse } from "../api/client";
import MathDisplay from "../components/MathDisplay";
import "../styles/LimitLab.css";

const POINT_PRESETS: { label: string; value: string }[] = [
  { label: "0", value: "0" },
  { label: "1", value: "1" },
  { label: "∞", value: "oo" },
  { label: "-∞", value: "-oo" },
];

const EXAMPLES: { label: string; expression: string; point: string }[] = [
  { label: "sin(x)/x en 0 (clásico)", expression: "sin(x)/x", point: "0" },
  { label: "(x²-1)/(x-1) en 1 (factoreable)", expression: "(x**2 - 1)/(x - 1)", point: "1" },
  { label: "1/x en 0 (no existe)", expression: "1/x", point: "0" },
  { label: "1/x² en 0 (diverge a ∞)", expression: "1/x**2", point: "0" },
  { label: "(1+1/x)**x en ∞ (→ e)", expression: "(1 + 1/x)**x", point: "oo" },
  { label: "1/x en ∞ (→ 0)", expression: "1/x", point: "oo" },
];

export default function LimitLab() {
  const [expression, setExpression] = useState("sin(x)/x");
  const [point, setPoint] = useState("0");
  const [result, setResult] = useState<LimitResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!expression.trim() || !point.trim()) return;
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

  function loadExample(ex: { expression: string; point: string }) {
    setExpression(ex.expression);
    setPoint(ex.point);
    setResult(null);
    setError("");
  }

  const getPointDisplay = (p: string) => {
    if (p === "oo" || p === "∞") return "∞";
    if (p === "-oo" || p === "-∞") return "-∞";
    return p;
  };

  // Determina el mensaje correcto según cómo resultó el cálculo:
  // existe y es finito / diverge a infinito / no existe / indeterminado.
  function getResultBanner(res: LimitResponse) {
    if (!res.exists) {
      if (res.left_limit === null && res.right_limit === null) {
        return { kind: "warn", text: "⚠️ No se pudo determinar este límite con los métodos disponibles." };
      }
      return { kind: "warn", text: "⚠️ Los límites laterales son distintos, el límite no existe en este punto." };
    }
    if (res.is_finite === false) {
      return { kind: "info", text: "∞ El límite existe pero diverge (es infinito)." };
    }
    return { kind: "ok", text: "✓ El límite existe y es finito." };
  }

  return (
    <div className="limit-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>Laboratorio de Límites</h1>

      <div className="examples-row" style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            type="button"
            onClick={() => loadExample(ex)}
            style={{
              fontSize: 13,
              padding: "4px 10px",
              borderRadius: 14,
              border: "1px solid #d1d5db",
              background: "#f9fafb",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            {ex.label}
          </button>
        ))}
      </div>

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
            <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
              {POINT_PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setPoint(p.value)}
                  style={{
                    fontSize: 12,
                    padding: "2px 8px",
                    borderRadius: 10,
                    border: point === p.value ? "1px solid #4f46e5" : "1px solid #d1d5db",
                    background: point === p.value ? "#eef2ff" : "white",
                    color: point === p.value ? "#4338ca" : "#374151",
                    cursor: "pointer",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="helper-text">Usa 'oo' para ∞</div>
          </div>
          <button type="submit" className="submit-btn" disabled={loading || !expression.trim() || !point.trim()}>
            <span>{loading ? "⏳" : "📈"}</span>
            {loading ? "Calculando..." : "Calcular"}
          </button>
        </div>
      </form>

      {error && <div className="error">{error}</div>}

      {result && (() => {
        const banner = getResultBanner(result);
        return (
          <div className={`result-card ${result.exists ? "exists" : "not-exists"}`}>
            <div className="result-content">
              <MathDisplay
                latex={`\\lim_{x \\to ${getPointDisplay(point)}} ${result.original_latex} = ${result.result_latex}`}
                block
              />
            </div>

            <div
              className={
                banner.kind === "ok"
                  ? "limit-exists-note"
                  : banner.kind === "info"
                  ? "limit-infinite-note"
                  : "limit-not-exists-note"
              }
            >
              {banner.text}
            </div>

            {result.left_limit !== null && result.right_limit !== null && (
              <div className="limit-details">
                <h3>Análisis de Límites Laterales</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)" }}>
                  <div>
                    <strong>Límite por la izquierda</strong>
                    <p>
                      <MathDisplay
                        latex={`\\lim_{x \\to ${getPointDisplay(point)}^-} f(x) = ${result.left_limit_latex ?? result.left_limit}`}
                        block={false}
                      />
                    </p>
                  </div>
                  <div>
                    <strong>Límite por la derecha</strong>
                    <p>
                      <MathDisplay
                        latex={`\\lim_{x \\to ${getPointDisplay(point)}^+} f(x) = ${result.right_limit_latex ?? result.right_limit}`}
                        block={false}
                      />
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}