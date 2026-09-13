import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      // Siempre mostramos el mismo mensaje de éxito, exista o no el
      // email — así nadie puede usar este formulario para averiguar
      // qué cuentas están registradas.
      setSent(true);
    } catch {
      setError("Hubo un problema al procesar la solicitud. Probá de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", padding: "0 16px" }}>
      <Link to="/login">&larr; Volver a iniciar sesión</Link>
      <h1>¿Olvidaste tu contraseña?</h1>

      {sent ? (
        <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: 16, marginTop: 16 }}>
          <p style={{ margin: 0 }}>
            Si <strong>{email}</strong> está registrado, te enviamos un email con un enlace
            para elegir una nueva contraseña. Revisá también la carpeta de spam.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <p>Ingresá tu email y te mandamos un enlace para restablecer tu contraseña.</p>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@email.com"
            style={{ width: "100%", padding: 8, marginBottom: 12, boxSizing: "border-box" }}
          />

          <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
            {loading ? "Enviando..." : "Enviar enlace de recuperación"}
          </button>
        </form>
      )}
    </div>
  );
}