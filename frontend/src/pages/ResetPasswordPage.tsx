import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (newPassword.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { token, new_password: newPassword });
      setDone(true);
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ??
          "El enlace es inválido o ya expiró. Pedí uno nuevo desde '¿Olvidaste tu contraseña?'"
      );
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 16px" }}>
        <h1>Enlace inválido</h1>
        <p>Este enlace no tiene el formato esperado. Pedí uno nuevo.</p>
        <Link to="/forgot-password">Solicitar enlace de recuperación</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 16px" }}>
      <h1>Elegir nueva contraseña</h1>

      {done ? (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 16 }}>
          <p>Tu contraseña se actualizó correctamente.</p>
          <Link to="/login">Iniciar sesión →</Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {error && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: 12, marginBottom: 12 }}>
              <p style={{ margin: 0, color: "#b91c1c" }}>{error}</p>
            </div>
          )}

          <label>Nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
          />

          <label>Confirmar nueva contraseña</label>
          <input
            type="password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
          />

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
            {loading ? "Guardando..." : "Guardar nueva contraseña"}
          </button>
        </form>
      )}
    </div>
  );
}