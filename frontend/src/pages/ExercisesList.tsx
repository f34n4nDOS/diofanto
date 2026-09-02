import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { exercisesAPI } from "../api/client";
import type { ExerciseOut, AttemptOut } from "../api/client";
import "../styles/AlgebraLab.css";

type ListTab = "all" | "favorites" | "history";

export default function ExercisesList() {
  const [activeTab, setActiveTab] = useState<ListTab>("all");
  const [exercises, setExercises] = useState<ExerciseOut[]>([]);
  const [favorites, setFavorites] = useState<ExerciseOut[]>([]);
  const [history, setHistory] = useState<AttemptOut[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [areaFilter, setAreaFilter] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("");

  useEffect(() => {
    if (activeTab === "all") loadExercises();
    else if (activeTab === "favorites") loadFavorites();
    else if (activeTab === "history") loadHistory();
  }, [activeTab, areaFilter, difficultyFilter]);

  async function loadExercises() {
    setLoading(true);
    setError(null);
    try {
      const res = await exercisesAPI.list({
        area: areaFilter || undefined,
        difficulty: difficultyFilter || undefined,
      });
      setExercises(res.items);
    } catch {
      setError("No se pudieron cargar los ejercicios");
    } finally {
      setLoading(false);
    }
  }

  async function loadFavorites() {
    setLoading(true);
    setError(null);
    try {
      setFavorites(await exercisesAPI.listFavorites());
    } catch {
      setError("No se pudieron cargar los favoritos");
    } finally {
      setLoading(false);
    }
  }

  async function loadHistory() {
    setLoading(true);
    setError(null);
    try {
      const res = await exercisesAPI.getHistory();
      setHistory(res.items);
    } catch {
      setError("No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="algebra-lab">
      <Link to="/dashboard" className="back-link">
        <span>←</span> Volver al dashboard
      </Link>
      <h1>📝 Ejercicios</h1>

      <nav className="tab-nav">
        <button className={`tab-button ${activeTab === "all" ? "active" : ""}`} onClick={() => setActiveTab("all")}>
          Todos
        </button>
        <button className={`tab-button ${activeTab === "favorites" ? "active" : ""}`} onClick={() => setActiveTab("favorites")}>
          Favoritos
        </button>
        <button className={`tab-button ${activeTab === "history" ? "active" : ""}`} onClick={() => setActiveTab("history")}>
          Historial
        </button>
      </nav>

      {error && <div className="error-message">⚠️ {error}</div>}

      {activeTab === "all" && (
        <div className="form-card">
          <div className="form-group" style={{ marginBottom: 16 }}>
            <div className="form-field">
              <label>Área</label>
              <select value={areaFilter} onChange={(e) => setAreaFilter(e.target.value)}>
                <option value="">Todas</option>
                <option value="algebra">Álgebra</option>
                <option value="calculo">Cálculo</option>
                <option value="geometria">Geometría</option>
              </select>
            </div>
            <div className="form-field">
              <label>Dificultad</label>
              <select value={difficultyFilter} onChange={(e) => setDifficultyFilter(e.target.value)}>
                <option value="">Todas</option>
                <option value="easy">Fácil</option>
                <option value="medium">Media</option>
                <option value="hard">Difícil</option>
              </select>
            </div>
          </div>

          {loading ? (
            <p>Cargando...</p>
          ) : exercises.length === 0 ? (
            <p>No hay ejercicios con esos filtros.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {exercises.map((ex) => (
                <Link key={ex.id} to={`/exercises/${ex.id}`} className="result-card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <strong>{ex.topic}</strong> · <span style={{ color: "#6b7280" }}>{ex.area} · {ex.difficulty}</span>
                      <p style={{ margin: "4px 0 0" }}>{ex.statement}</p>
                    </div>
                    <span>→</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="form-card">
          {loading ? (
            <p>Cargando...</p>
          ) : favorites.length === 0 ? (
            <p>Todavía no marcaste ningún ejercicio como favorito.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {favorites.map((ex) => (
                <Link key={ex.id} to={`/exercises/${ex.id}`} className="result-card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <strong>{ex.topic}</strong> · <span style={{ color: "#6b7280" }}>{ex.area}</span>
                  <p style={{ margin: "4px 0 0" }}>{ex.statement}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <div className="form-card">
          {loading ? (
            <p>Cargando...</p>
          ) : history.length === 0 ? (
            <p>Todavía no resolviste ningún ejercicio.</p>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              {history.map((a) => (
                <Link key={a.id} to={`/exercises/${a.exercise_id}`} className="result-card" style={{ display: "block", textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>{a.exercise_topic}</strong> · <span style={{ color: "#6b7280" }}>{a.exercise_area}</span>
                      <p style={{ margin: "4px 0 0" }}>{a.exercise_statement}</p>
                      <p style={{ fontSize: 13, color: "#6b7280" }}>
                        Intento #{a.attempt_number} · {new Date(a.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span style={{ color: a.is_correct ? "#16a34a" : "#dc2626", fontWeight: 600 }}>
                      {a.is_correct ? "✓ Correcto" : "✗ Incorrecto"}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}