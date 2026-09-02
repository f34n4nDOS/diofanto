import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { exercisesAPI } from "../api/client";
import type { ExerciseOut, ExerciseSubmitResponse } from "../api/client";
import "../styles/AlgebraLab.css";

export default function ExerciseDetail() {
  const { id } = useParams<{ id: string }>();
  const exerciseId = Number(id);

  const [exercise, setExercise] = useState<ExerciseOut | null>(null);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<ExerciseSubmitResponse | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  async function loadExercise() {
    setLoading(true);
    setError(null);
    setResult(null);
    setAnswer("");
    try {
      const ex = await exercisesAPI.get(exerciseId);
      setExercise(ex);

      const favs = await exercisesAPI.listFavorites();
      setIsFavorite(favs.some((f) => f.id === exerciseId));
    } catch {
      setError("No se pudo cargar el ejercicio");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!exercise) return;
    setSubmitting(true);
    setError(null);
    try {
      let parsedAnswer: any = answer;
      if (exercise.exercise_type === "numeric") parsedAnswer = Number(answer);

      const res = await exercisesAPI.submit(exerciseId, parsedAnswer);
      setResult(res);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? "No se pudo enviar la respuesta");
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleFavorite() {
    try {
      if (isFavorite) {
        await exercisesAPI.removeFavorite(exerciseId);
      } else {
        await exercisesAPI.addFavorite(exerciseId);
      }
      setIsFavorite(!isFavorite);
    } catch {
      setError("No se pudo actualizar favoritos");
    }
  }

  function tryAgain() {
    setResult(null);
    setAnswer("");
  }

  if (loading) return <div className="algebra-lab"><p>Cargando...</p></div>;
  if (!exercise) return <div className="algebra-lab"><p>Ejercicio no encontrado.</p></div>;

  return (
    <div className="algebra-lab">
      <Link to="/exercises" className="back-link">
        <span>←</span> Volver a ejercicios
      </Link>

      <div className="form-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div>
            <span style={{ color: "#6b7280" }}>{exercise.area} · {exercise.topic} · {exercise.difficulty}</span>
            <h2 style={{ marginTop: 4 }}>{exercise.statement}</h2>
          </div>
          <button onClick={toggleFavorite} className="submit-btn" style={{ background: isFavorite ? "#f59e0b" : "#e5e7eb", color: isFavorite ? "white" : "#374151" }}>
            {isFavorite ? "★ Favorito" : "☆ Marcar favorito"}
          </button>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        {!result && (
          <div className="form-group" style={{ marginTop: 16 }}>
            <div className="form-field" style={{ gridColumn: "1 / -1" }}>
              <label>Tu respuesta</label>
              <input
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={exercise.exercise_type === "numeric" ? "Escribí un número" : "Escribí tu respuesta"}
              />
            </div>
            <button onClick={handleSubmit} disabled={submitting || !answer} className="submit-btn">
              {submitting ? "⏳ Enviando..." : "✓ Enviar respuesta"}
            </button>
          </div>
        )}

        {result && (
          <div className="result-card" style={{ marginTop: 16 }}>
            {result.is_correct ? (
              <h3 style={{ color: "#16a34a" }}>✓ ¡Correcto!</h3>
            ) : (
              <>
                <h3 style={{ color: "#dc2626" }}>✗ Incorrecto</h3>
                {result.correct_answer !== null && (
                  <p><strong>Respuesta correcta:</strong> {String(result.correct_answer)}</p>
                )}
              </>
            )}
            {result.explanation && <p><strong>Explicación:</strong> {result.explanation}</p>}
            <p style={{ fontSize: 13, color: "#6b7280" }}>Intento #{result.attempt_number}</p>

            <button onClick={tryAgain} className="submit-btn" style={{ marginTop: 12 }}>
              ↻ Intentar de nuevo
            </button>
          </div>
        )}
      </div>
    </div>
  );
}