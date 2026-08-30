import { useState } from "react";
import { algebraAPI } from "../api/client";
import type {
  EquationResponse,
  SystemResponse,
  FactorResponse,
  SimplifyResponse,
  ExpandResponse,
} from "../api/client";
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
    setLoading(true);
    setError(null);
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
    setLoading(true);
    setError(null);
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
    setLoading(true);
    setError(null);
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
    setLoading(true);
    setError(null);
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
    setLoading(true);
    setError(null);
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
      <div className="algebra-header">
        <h1>🧮 Laboratorio de Álgebra</h1>
        <p>Resuelve ecuaciones, sistemas y manipula expresiones algebraicas</p>
      </div>

      <div className="algebra-tabs">
        <button
          className={`tab-btn ${activeTab === "equations" ? "active" : ""}`}
          onClick={() => setActiveTab("equations")}
        >
          Ecuaciones
        </button>
        <button
          className={`tab-btn ${activeTab === "systems" ? "active" : ""}`}
          onClick={() => setActiveTab("systems")}
        >
          Sistemas
        </button>
        <button
          className={`tab-btn ${activeTab === "factor" ? "active" : ""}`}
          onClick={() => setActiveTab("factor")}
        >
          Factorizar
        </button>
        <button
          className={`tab-btn ${activeTab === "simplify" ? "active" : ""}`}
          onClick={() => setActiveTab("simplify")}
        >
          Simplificar
        </button>
        <button
          className={`tab-btn ${activeTab === "expand" ? "active" : ""}`}
          onClick={() => setActiveTab("expand")}
        >
          Expandir
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="algebra-content">
        {activeTab === "equations" && (
          <div className="algebra-section">
            <h2>Resolver Ecuaciones</h2>
            <div className="input-group">
              <label>Ecuación:</label>
              <input
                type="text"
                value={equation}
                onChange={(e) => setEquation(e.target.value)}
                placeholder="ej: x**2 - 5*x + 6 = 0"
              />
            </div>
            <div className="input-group">
              <label>Variable:</label>
              <input
                type="text"
                value={equationVar}
                onChange={(e) => setEquationVar(e.target.value)}
                placeholder="x, y, z, t"
                maxLength={1}
              />
            </div>
            <button
              onClick={handleSolveEquation}
              disabled={loading}
              className="solve-btn"
            >
              {loading ? "Resolviendo..." : "Resolver"}
            </button>

            {equationResult && (
              <div className="result-box">
                <h3>Resultado</h3>
                <div className="result-item">
                  <strong>Ecuación:</strong>
                  <p className="latex">
                    {equationResult.original_latex}
                  </p>
                </div>
                <div className="result-item">
                  <strong>Variable:</strong> {equationResult.variable}
                </div>
                <div className="result-item">
                  <strong>Número de soluciones:</strong> {equationResult.num_solutions}
                </div>
                {equationResult.is_quadratic && (
                  <div className="result-item">
                    <strong>Tipo:</strong> Ecuación cuadrática
                  </div>
                )}
                <div className="result-item">
                  <strong>Soluciones:</strong>
                  <ul>
                    {equationResult.solutions.map((_, i) => (
                      <li key={i}>
                        <span className="latex">{equationResult.solutions_latex[i]}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            <div className="examples">
              <h4>Ejemplos:</h4>
              <ul>
                <li>x**2 - 5*x + 6 = 0 (cuadrática)</li>
                <li>2*x + 3 = 7 (lineal)</li>
                <li>x**3 - 1 = 0 (cúbica)</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "systems" && (
          <div className="algebra-section">
            <h2>Resolver Sistemas de Ecuaciones</h2>
            <div className="input-group">
              <label>Primera ecuación:</label>
              <input
                type="text"
                value={sysEq1}
                onChange={(e) => setSysEq1(e.target.value)}
                placeholder="ej: x + y = 5"
              />
            </div>
            <div className="input-group">
              <label>Segunda ecuación:</label>
              <input
                type="text"
                value={sysEq2}
                onChange={(e) => setSysEq2(e.target.value)}
                placeholder="ej: 2*x - y = 1"
              />
            </div>
            <div className="input-row">
              <div className="input-group">
                <label>Variable 1:</label>
                <input
                  type="text"
                  value={sysVar1}
                  onChange={(e) => setSysVar1(e.target.value)}
                  maxLength={1}
                />
              </div>
              <div className="input-group">
                <label>Variable 2:</label>
                <input
                  type="text"
                  value={sysVar2}
                  onChange={(e) => setSysVar2(e.target.value)}
                  maxLength={1}
                />
              </div>
            </div>
            <button
              onClick={handleSolveSystem}
              disabled={loading}
              className="solve-btn"
            >
              {loading ? "Resolviendo..." : "Resolver Sistema"}
            </button>

            {systemResult && (
              <div className="result-box">
                <h3>Solución</h3>
                {systemResult.is_solvable ? (
                  <>
                    <div className="result-item">
                      <strong>Sistema:</strong>
                      <div className="equation-list">
                        {systemResult.equations_latex.map((eq, i) => (
                          <p key={i} className="latex">{eq}</p>
                        ))}
                      </div>
                    </div>
                    <div className="result-item">
                      <strong>Solución:</strong>
                      <div className="solution-grid">
                        {Object.entries(systemResult.solution).map(([var_name]) => (
                          <div key={var_name} className="solution-item">
                            <span>{var_name} = </span>
                            <span className="latex">
                              {systemResult.solution_latex[var_name]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                ) : (
                  <p className="error">El sistema no tiene solución (o es incompatible)</p>
                )}
              </div>
            )}

            <div className="examples">
              <h4>Ejemplo:</h4>
              <p>x + y = 5</p>
              <p>2x - y = 1</p>
              <p>Solución: x = 2, y = 3</p>
            </div>
          </div>
        )}

        {activeTab === "factor" && (
          <div className="algebra-section">
            <h2>Factorizar Expresiones</h2>
            <div className="input-group">
              <label>Expresión:</label>
              <input
                type="text"
                value={factorExpr}
                onChange={(e) => setFactorExpr(e.target.value)}
                placeholder="ej: x**2 - 5*x + 6"
              />
            </div>
            <div className="input-group">
              <label>Variable:</label>
              <input
                type="text"
                value={factorVar}
                onChange={(e) => setFactorVar(e.target.value)}
                maxLength={1}
              />
            </div>
            <button
              onClick={handleFactor}
              disabled={loading}
              className="solve-btn"
            >
              {loading ? "Factorizando..." : "Factorizar"}
            </button>

            {factorResult && (
              <div className="result-box">
                <h3>Resultado</h3>
                <div className="result-item">
                  <strong>Expresión original:</strong>
                  <p className="latex">{factorResult.original_latex}</p>
                </div>
                <div className="result-item">
                  <strong>Factorizada:</strong>
                  <p className="latex">{factorResult.factored_latex}</p>
                </div>
                {factorResult.factors.length > 0 && (
                  <div className="result-item">
                    <strong>Factores:</strong>
                    <ul>
                      {factorResult.factors.map((_, i) => (
                        <li key={i}>
                          <span className="latex">{factorResult.factors_latex[i]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="examples">
              <h4>Ejemplos:</h4>
              <ul>
                <li>x**2 - 5*x + 6 = (x - 2)(x - 3)</li>
                <li>x**2 - 1 = (x - 1)(x + 1)</li>
                <li>x**3 - 1</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "simplify" && (
          <div className="algebra-section">
            <h2>Simplificar Expresiones</h2>
            <div className="input-group">
              <label>Expresión:</label>
              <input
                type="text"
                value={simplifyExpr}
                onChange={(e) => setSimplifyExpr(e.target.value)}
                placeholder="ej: (x**2 - 1)/(x - 1)"
              />
            </div>
            <button
              onClick={handleSimplify}
              disabled={loading}
              className="solve-btn"
            >
              {loading ? "Simplificando..." : "Simplificar"}
            </button>

            {simplifyResult && (
              <div className="result-box">
                <h3>Resultado</h3>
                <div className="result-item">
                  <strong>Original:</strong>
                  <p className="latex">{simplifyResult.original_latex}</p>
                </div>
                <div className="result-item">
                  <strong>Simplificada:</strong>
                  <p className="latex">{simplifyResult.simplified_latex}</p>
                </div>
                {simplifyResult.steps.length > 0 && (
                  <div className="result-item">
                    <strong>Pasos:</strong>
                    <ol>
                      {simplifyResult.steps.map((step, i) => (
                        <li key={i}>
                          {step.step}: <span className="latex">{step.expression}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            )}

            <div className="examples">
              <h4>Ejemplos:</h4>
              <ul>
                <li>(x**2 - 1)/(x - 1) = x + 1</li>
                <li>x**2 + 2*x + 1 = (x + 1)**2</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === "expand" && (
          <div className="algebra-section">
            <h2>Expandir Expresiones</h2>
            <div className="input-group">
              <label>Expresión:</label>
              <input
                type="text"
                value={expandExpr}
                onChange={(e) => setExpandExpr(e.target.value)}
                placeholder="ej: (x + 1)**2"
              />
            </div>
            <div className="input-group">
              <label>Variable:</label>
              <input
                type="text"
                value={expandVar}
                onChange={(e) => setExpandVar(e.target.value)}
                maxLength={1}
              />
            </div>
            <button
              onClick={handleExpand}
              disabled={loading}
              className="solve-btn"
            >
              {loading ? "Expandiendo..." : "Expandir"}
            </button>

            {expandResult && (
              <div className="result-box">
                <h3>Resultado</h3>
                <div className="result-item">
                  <strong>Original:</strong>
                  <p className="latex">{expandResult.original_latex}</p>
                </div>
                <div className="result-item">
                  <strong>Expandida:</strong>
                  <p className="latex">{expandResult.expanded_latex}</p>
                </div>
              </div>
            )}

            <div className="examples">
              <h4>Ejemplos:</h4>
              <ul>
                <li>(x + 1)**2 = x**2 + 2*x + 1</li>
                <li>(x - 1)**3 = x**3 - 3*x**2 + 3*x - 1</li>
                <li>(x + y)*(x - y) = x**2 - y**2</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
