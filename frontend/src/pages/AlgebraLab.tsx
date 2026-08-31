import { useState } from "react";
import { Link } from "react-router-dom";
import { algebraAPI } from "../api/client";
import type {
  EquationResponse,
  SystemResponse,
  FactorResponse,
  SimplifyResponse,
  ExpandResponse,
} from "../api/client";
import MathDisplay from "../components/MathDisplay";
import "../styles/AlgebraLab.css";

type AlgebraTab = "equations" | "systems" | "factor" | "simplify" | "expand";

export default function AlgebraLab() {
  const [activeTab, setActiveTab] = useState<AlgebraTab>("equations");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Equation solving
  const [equation, setEquation] = useState("x**2 - 5*x + 6 = 0");
  const [equationVar, setEquationVar] = useState("x");
  const [equationResult, setEquationResult] = useState<EquationResponse | null>(null);

  // System solving
  const [sysEq1, setSysEq1] = useState("x + y = 5");
  const [sysEq2, setSysEq2] = useState("2*x - y = 1");
  const [sysVar1, setSysVar1] = useState("x");
  const [sysVar2, setSysVar2] = useState("y");
  const [systemResult, setSystemResult] = useState<SystemResponse | null>(null);

  // Factoring
  const [factorExpr, setFactorExpr] = useState("x**2 - 5*x + 6");
  const [factorVar, setFactorVar] = useState("x");
  const [factorResult, setFactorResult] = useState<FactorResponse | null>(null);

  // Simplifying
  const [simplifyExpr, setSimplifyExpr] = useState("(x**2 - 1)/(x - 1)");
  const [simplifyResult, setSimplifyResult] = useState<SimplifyResponse | null>(null);

  // Expanding
  const [expandExpr, setExpandExpr] = useState("(x + 1)**2");
  const [expandVar, setExpandVar] = useState("x");
  const [expandResult, setExpandResult] = useState<ExpandResponse | null>(null);

  const handleSolveEquation = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await algebraAPI.solveEquation(equation, equationVar);
      setEquationResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al resolver la ecuación");
    } finally {
      setLoading(false);
    }
  };

  const handleSolveSystem = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await algebraAPI.solveSystem(
        [sysEq1, sysEq2],
        [sysVar1, sysVar2]
      );
      setSystemResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al resolver el sistema");
    } finally {
      setLoading(false);
    }
  };

  const handleFactor = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await algebraAPI.factor(factorExpr, factorVar);
      setFactorResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al factorizar");
    } finally {
      setLoading(false);
    }
  };

  const handleSimplify = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await algebraAPI.simplify(simplifyExpr);
      setSimplifyResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al simplificar");
    } finally {
      setLoading(false);
    }
  };

  const handleExpand = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await algebraAPI.expand(expandExpr, expandVar);
      setExpandResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al expandir");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="algebra-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>🧮 Laboratorio de Álgebra</h1>

      <nav className="tab-nav">
        <button
          className={`tab-button ${activeTab === "equations" ? "active" : ""}`}
          onClick={() => { setActiveTab("equations"); setError(null); }}
          title="Resolver ecuaciones"
        >
          Ecuaciones
        </button>
        <button
          className={`tab-button ${activeTab === "systems" ? "active" : ""}`}
          onClick={() => { setActiveTab("systems"); setError(null); }}
          title="Resolver sistemas"
        >
          Sistemas
        </button>
        <button
          className={`tab-button ${activeTab === "factor" ? "active" : ""}`}
          onClick={() => { setActiveTab("factor"); setError(null); }}
          title="Factorizar expresiones"
        >
          Factorizar
        </button>
        <button
          className={`tab-button ${activeTab === "simplify" ? "active" : ""}`}
          onClick={() => { setActiveTab("simplify"); setError(null); }}
          title="Simplificar expresiones"
        >
          Simplificar
        </button>
        <button
          className={`tab-button ${activeTab === "expand" ? "active" : ""}`}
          onClick={() => { setActiveTab("expand"); setError(null); }}
          title="Expandir expresiones"
        >
          Expandir
        </button>
      </nav>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="tab-content">
        {activeTab === "equations" && (
          <div className="form-card">
            <h2>Resolver Ecuaciones</h2>
            <div className="form-group">
              <div className="form-field">
                <label htmlFor="eq-input">Ecuación</label>
                <input
                  id="eq-input"
                  type="text"
                  value={equation}
                  onChange={(e) => setEquation(e.target.value)}
                  placeholder="ej: x**2 - 5*x + 6 = 0"
                />
              </div>
              <div className="form-field" style={{ minWidth: "100px" }}>
                <label htmlFor="eq-var">Variable</label>
                <input
                  id="eq-var"
                  type="text"
                  value={equationVar}
                  onChange={(e) => setEquationVar(e.target.value)}
                  placeholder="x"
                  maxLength={1}
                />
              </div>
              <button
                onClick={handleSolveEquation}
                disabled={loading}
                className="submit-btn"
              >
                <span>{loading ? "⏳" : "✓"}</span>
                {loading ? "Resolviendo..." : "Resolver"}
              </button>
            </div>

            {equationResult && (
              <div className="result-card">
                <h3>✓ Solución Encontrada</h3>
                <div className="result-content">
                  <MathDisplay 
                    latex={equationResult.original_latex}
                    block 
                  />
                </div>
                
                <div className="result-details">
                  <div className="detail-item">
                    <strong>Variable</strong>
                    <span>{equationResult.variable}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Tipo</strong>
                    <span>{equationResult.is_quadratic ? "Cuadrática" : "Polinómica"}</span>
                  </div>
                  <div className="detail-item">
                    <strong>Soluciones</strong>
                    <span>{equationResult.num_solutions}</span>
                  </div>
                </div>

                {equationResult.solutions.length > 0 && (
                  <div className="steps-section">
                    <h4>Soluciones</h4>
                    <ul className="steps-list">
                      {equationResult.solutions.map((_, i) => (
                        <li key={i}>
                          <MathDisplay
                            latex={equationResult.solutions_latex[i]}
                            block={false}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "systems" && (
          <div className="form-card">
            <h2>Resolver Sistemas de Ecuaciones</h2>
            <div className="form-group">
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="sys-eq1">Primera Ecuación</label>
                <input
                  id="sys-eq1"
                  type="text"
                  value={sysEq1}
                  onChange={(e) => setSysEq1(e.target.value)}
                  placeholder="ej: x + y = 5"
                />
              </div>
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="sys-eq2">Segunda Ecuación</label>
                <input
                  id="sys-eq2"
                  type="text"
                  value={sysEq2}
                  onChange={(e) => setSysEq2(e.target.value)}
                  placeholder="ej: 2*x - y = 1"
                />
              </div>
              <div className="form-field">
                <label htmlFor="sys-var1">Variable 1</label>
                <input
                  id="sys-var1"
                  type="text"
                  value={sysVar1}
                  onChange={(e) => setSysVar1(e.target.value)}
                  maxLength={1}
                  placeholder="x"
                />
              </div>
              <div className="form-field">
                <label htmlFor="sys-var2">Variable 2</label>
                <input
                  id="sys-var2"
                  type="text"
                  value={sysVar2}
                  onChange={(e) => setSysVar2(e.target.value)}
                  maxLength={1}
                  placeholder="y"
                />
              </div>
              <button
                onClick={handleSolveSystem}
                disabled={loading}
                className="submit-btn"
                style={{ gridColumn: "1 / -1" }}
              >
                <span>{loading ? "⏳" : "✓"}</span>
                {loading ? "Resolviendo..." : "Resolver Sistema"}
              </button>
            </div>

            {systemResult && (
              <div className="result-card">
                <h3>✓ Sistema Resuelto</h3>
                {systemResult.is_solvable ? (
                  <>
                    <div className="result-details">
                      {Object.entries(systemResult.solution).map(([var_name]) => (
                        <div key={var_name} className="detail-item">
                          <strong>{var_name}</strong>
                          <MathDisplay
                            latex={systemResult.solution_latex[var_name]}
                            block={false}
                          />
                        </div>
                      ))}
                    </div>

                    <div className="steps-section">
                      <h4>Sistema de Ecuaciones</h4>
                      <ul className="steps-list">
                        {systemResult.equations_latex.map((eq, i) => (
                          <li key={i}>
                            <MathDisplay
                              latex={eq}
                              block={false}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <div className="error-message">
                    El sistema no tiene solución (es incompatible o dependiente)
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "factor" && (
          <div className="form-card">
            <h2>Factorizar Expresiones</h2>
            <div className="form-group">
              <div className="form-field" style={{ gridColumn: "1 / 3" }}>
                <label htmlFor="factor-expr">Expresión</label>
                <input
                  id="factor-expr"
                  type="text"
                  value={factorExpr}
                  onChange={(e) => setFactorExpr(e.target.value)}
                  placeholder="ej: x**2 - 5*x + 6"
                />
              </div>
              <div className="form-field">
                <label htmlFor="factor-var">Variable</label>
                <input
                  id="factor-var"
                  type="text"
                  value={factorVar}
                  onChange={(e) => setFactorVar(e.target.value)}
                  maxLength={1}
                  placeholder="x"
                />
              </div>
              <button
                onClick={handleFactor}
                disabled={loading}
                className="submit-btn"
              >
                <span>{loading ? "⏳" : "✓"}</span>
                {loading ? "Factorizando..." : "Factorizar"}
              </button>
            </div>

            {factorResult && (
              <div className="result-card">
                <h3>✓ Factorización Completa</h3>
                <div className="steps-section">
                  <h4>Expresión Original</h4>
                  <MathDisplay 
                    latex={factorResult.original_latex}
                    block 
                  />
                </div>

                <div className="steps-section">
                  <h4>Expresión Factorizada</h4>
                  <MathDisplay 
                    latex={factorResult.factored_latex}
                    block 
                  />
                </div>

                {factorResult.factors.length > 0 && (
                  <div className="steps-section">
                    <h4>Factores</h4>
                    <ul className="steps-list">
                      {factorResult.factors.map((_, i) => (
                        <li key={i}>
                          <MathDisplay
                            latex={factorResult.factors_latex[i]}
                            block={false}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "simplify" && (
          <div className="form-card">
            <h2>Simplificar Expresiones</h2>
            <div className="form-group">
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label htmlFor="simplify-expr">Expresión</label>
                <input
                  id="simplify-expr"
                  type="text"
                  value={simplifyExpr}
                  onChange={(e) => setSimplifyExpr(e.target.value)}
                  placeholder="ej: (x**2 - 1)/(x - 1)"
                />
              </div>
              <button
                onClick={handleSimplify}
                disabled={loading}
                className="submit-btn"
                style={{ gridColumn: "1 / -1" }}
              >
                <span>{loading ? "⏳" : "✓"}</span>
                {loading ? "Simplificando..." : "Simplificar"}
              </button>
            </div>

            {simplifyResult && (
              <div className="result-card">
                <h3>✓ Expresión Simplificada</h3>
                <div className="steps-section">
                  <h4>Expresión Original</h4>
                  <MathDisplay 
                    latex={simplifyResult.original_latex}
                    block 
                  />
                </div>

                <div className="steps-section">
                  <h4>Expresión Simplificada</h4>
                  <MathDisplay 
                    latex={simplifyResult.simplified_latex}
                    block 
                  />
                </div>

                {simplifyResult.steps.length > 0 && (
                  <div className="steps-section">
                    <h4>Pasos de Simplificación</h4>
                    <ol style={{ marginLeft: "var(--spacing-lg)" }}>
                      {simplifyResult.steps.map((step, i) => (
                        <li key={i} style={{ marginBottom: "var(--spacing-sm)" }}>
                          <strong>{step.step}:</strong>{" "}
                          <MathDisplay
                            latex={step.expression}
                            block={false}
                          />
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "expand" && (
          <div className="form-card">
            <h2>Expandir Expresiones</h2>
            <div className="form-group">
              <div className="form-field" style={{ gridColumn: "1 / 3" }}>
                <label htmlFor="expand-expr">Expresión</label>
                <input
                  id="expand-expr"
                  type="text"
                  value={expandExpr}
                  onChange={(e) => setExpandExpr(e.target.value)}
                  placeholder="ej: (x + 1)**2"
                />
              </div>
              <div className="form-field">
                <label htmlFor="expand-var">Variable</label>
                <input
                  id="expand-var"
                  type="text"
                  value={expandVar}
                  onChange={(e) => setExpandVar(e.target.value)}
                  maxLength={1}
                  placeholder="x"
                />
              </div>
              <button
                onClick={handleExpand}
                disabled={loading}
                className="submit-btn"
              >
                <span>{loading ? "⏳" : "✓"}</span>
                {loading ? "Expandiendo..." : "Expandir"}
              </button>
            </div>

            {expandResult && (
              <div className="result-card">
                <h3>✓ Expresión Expandida</h3>
                <div className="steps-section">
                  <h4>Expresión Original</h4>
                  <MathDisplay 
                    latex={expandResult.original_latex}
                    block 
                  />
                </div>

                <div className="steps-section">
                  <h4>Expresión Expandida</h4>
                  <MathDisplay 
                    latex={expandResult.expanded_latex}
                    block 
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
  
