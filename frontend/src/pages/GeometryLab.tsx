import { useState } from "react";
import { Link } from "react-router-dom";
import { geometryAPI } from "../api/client";
import type { TriangleResponse, CircleResponse, RegularPolygonResponse } from "../api/client";
import "../styles/AlgebraLab.css"; // reutilizamos las mismas clases
import { TriangleFigure, CircleFigure, PolygonFigure } from "../components/GeometryFigure";
import GeometryConstructor from "../components/GeometryConstructor";

type GeometryTab = "triangle" | "circle" | "polygon" | "constructor";

export default function GeometryLab() {
  const [activeTab, setActiveTab] = useState<GeometryTab>("triangle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Triángulo
  const [sideA, setSideA] = useState("3");
  const [sideB, setSideB] = useState("4");
  const [sideC, setSideC] = useState("5");
  const [triangleResult, setTriangleResult] = useState<TriangleResponse | null>(null);

  // Circunferencia
  const [radius, setRadius] = useState("5");
  const [circleResult, setCircleResult] = useState<CircleResponse | null>(null);

  // Polígono regular
  const [numSides, setNumSides] = useState("6");
  const [sideLength, setSideLength] = useState("4");
  const [polygonResult, setPolygonResult] = useState<RegularPolygonResponse | null>(null);

  const handleTriangle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await geometryAPI.triangle(Number(sideA), Number(sideB), Number(sideC));
      setTriangleResult(result);
      if (!result.valid) {
        setError("Esos lados no forman un triángulo válido (la suma de los dos menores debe superar al mayor)");
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al resolver el triángulo");
    } finally {
      setLoading(false);
    }
  };

  const handleCircle = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await geometryAPI.circle(Number(radius));
      setCircleResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al calcular la circunferencia");
    } finally {
      setLoading(false);
    }
  };

  const handlePolygon = async () => {
    setError(null);
    setLoading(true);
    try {
      const result = await geometryAPI.regularPolygon(Number(numSides), Number(sideLength));
      setPolygonResult(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al calcular el polígono");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="algebra-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>📐 Laboratorio de Geometría</h1>

      <nav className="tab-nav">
        <button
          className={`tab-button ${activeTab === "triangle" ? "active" : ""}`}
          onClick={() => { setActiveTab("triangle"); setError(null); }}
        >
          Triángulos
        </button>
        <button
          className={`tab-button ${activeTab === "circle" ? "active" : ""}`}
          onClick={() => { setActiveTab("circle"); setError(null); }}
        >
          Circunferencia
        </button>
        <button
          className={`tab-button ${activeTab === "polygon" ? "active" : ""}`}
          onClick={() => { setActiveTab("polygon"); setError(null); }}
        >
          Polígonos regulares
        </button>
        <button
          className={`tab-button ${activeTab === "constructor" ? "active" : ""}`}
          onClick={() => { setActiveTab("constructor"); setError(null); }}
        >
          Construcción libre
        </button>
      </nav>

      {error && <div className="error-message">⚠️ {error}</div>}

      <div className="tab-content">
        {activeTab === "triangle" && (
          <div className="form-card">
            <h2>Resolver Triángulo (lado-lado-lado)</h2>
            <div className="form-group">
              <div className="form-field">
                <label>Lado a</label>
                <input type="number" value={sideA} onChange={(e) => setSideA(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Lado b</label>
                <input type="number" value={sideB} onChange={(e) => setSideB(e.target.value)} />
              </div>
              <div className="form-field">
                <label>Lado c</label>
                <input type="number" value={sideC} onChange={(e) => setSideC(e.target.value)} />
              </div>
              <button onClick={handleTriangle} disabled={loading} className="submit-btn">
                {loading ? "⏳ Calculando..." : "✓ Resolver"}
              </button>
            </div>

            {triangleResult?.valid && (
              <div className="result-card">
                <h3>✓ Triángulo resuelto</h3>
                <TriangleFigure data={triangleResult} />
                <div className="result-details">
                  <div className="detail-item"><strong>Perímetro</strong><span>{triangleResult.perimeter}</span></div>
                  <div className="detail-item"><strong>Área</strong><span>{triangleResult.area}</span></div>
                  <div className="detail-item"><strong>Según lados</strong><span>{triangleResult.type_sides}</span></div>
                  <div className="detail-item"><strong>Según ángulos</strong><span>{triangleResult.type_angles}</span></div>
                </div>
                <div className="steps-section">
                  <h4>Ángulos internos</h4>
                  <ul className="steps-list">
                    {triangleResult.angles?.map((ang, i) => (
                      <li key={i}>Ángulo {String.fromCharCode(65 + i)}: {ang}°</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "circle" && (
          <div className="form-card">
            <h2>Calculadora de Circunferencia</h2>
            <div className="form-group">
              <div className="form-field">
                <label>Radio</label>
                <input type="number" value={radius} onChange={(e) => setRadius(e.target.value)} />
              </div>
              <button onClick={handleCircle} disabled={loading} className="submit-btn">
                {loading ? "⏳ Calculando..." : "✓ Calcular"}
              </button>
            </div>

            {circleResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <CircleFigure data={circleResult} />
                <div className="result-details">
                  <div className="detail-item"><strong>Diámetro</strong><span>{circleResult.diameter}</span></div>
                  <div className="detail-item"><strong>Área</strong><span>{circleResult.area}</span></div>
                  <div className="detail-item"><strong>Longitud (perímetro)</strong><span>{circleResult.circumference}</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "polygon" && (
          <div className="form-card">
            <h2>Polígono Regular</h2>
            <div className="form-group">
              <div className="form-field">
                <label>Cantidad de lados</label>
                <input type="number" value={numSides} onChange={(e) => setNumSides(e.target.value)} min={3} />
              </div>
              <div className="form-field">
                <label>Longitud del lado</label>
                <input type="number" value={sideLength} onChange={(e) => setSideLength(e.target.value)} />
              </div>
              <button onClick={handlePolygon} disabled={loading} className="submit-btn">
                {loading ? "⏳ Calculando..." : "✓ Calcular"}
              </button>
            </div>

            {polygonResult && (
              <div className="result-card">
                <h3>✓ Resultado</h3>
                <PolygonFigure data={polygonResult} />
                <div className="result-details">
                  <div className="detail-item"><strong>Perímetro</strong><span>{polygonResult.perimeter}</span></div>
                  <div className="detail-item"><strong>Área</strong><span>{polygonResult.area}</span></div>
                  <div className="detail-item"><strong>Ángulo interior</strong><span>{polygonResult.interior_angle}°</span></div>
                  <div className="detail-item"><strong>Ángulo exterior</strong><span>{polygonResult.exterior_angle}°</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "constructor" && (
          <div className="form-card">
            <h2>Construcción Libre</h2>
            <p>
              Construí figuras con herramientas precisas (punto, recta, círculo,
              polígono) que podés arrastrar y medir, o dibujá libremente encima
              con la herramienta de mano alzada.
            </p>
            <GeometryConstructor />
          </div>
        )}
      </div>
    </div>
  );
}