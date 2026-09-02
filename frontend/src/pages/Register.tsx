import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch {
      setError("No se pudo registrar. ¿El email ya existe?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-screen">
      {/* Panel de marca — solo visible en pantallas anchas */}
      <aside className="auth-showcase grid-paper" aria-hidden="true">
        <div className="auth-showcase__content">
          <span className="brand-mark auth-showcase__brand">Diofanto</span>
          <p className="auth-showcase__tagline">
            Sumate y empezá a resolver.
          </p>

          <svg
            className="auth-showcase__plot"
            viewBox="0 0 320 220"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Ejes */}
            <line x1="20" y1="190" x2="300" y2="190" stroke="var(--neutral-400)" strokeWidth="1.5" />
            <line x1="40" y1="20" x2="40" y2="200" stroke="var(--neutral-400)" strokeWidth="1.5" />

            {/* Curva: parábola estilizada */}
            <path
              d="M 55 185 C 110 40, 190 40, 285 175"
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="3"
              strokeLinecap="round"
            />

            {/* Puntos marcados sobre la curva */}
            <circle cx="90" cy="95" r="5" fill="var(--primary)" />
            <circle cx="170" cy="45" r="5" fill="var(--spark)" />
            <circle cx="245" cy="115" r="5" fill="var(--primary)" />

            {/* Etiquetas */}
            <text x="160" y="30" fontSize="13" fill="var(--ink)" fontFamily="var(--font-display)">
              f(x)
            </text>
            <text x="292" y="205" fontSize="13" fill="var(--ink)" fontFamily="var(--font-display)">
              x
            </text>
          </svg>

          <p className="auth-showcase__caption">
            Álgebra, geometría, cálculo, probabilidad y modelaje matemático,
            todo en un mismo lugar — pensado para acompañarte durante el
            terciario o la universidad.
          </p>
        </div>
      </aside>

      {/* Panel del formulario */}
      <main className="auth-form-panel">
        <div className="auth-form-card">
           <Link to="/">Volver </Link>
          <h1 className="auth-form-card__title">Crear cuenta</h1>
          <p className="auth-form-card__subtitle">
            Registrate gratis y empezá a practicar.
          </p>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="register-name">Nombre</label>
              <input
                id="register-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                type="text"
                autoComplete="name"
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-email">Email</label>
              <input
                id="register-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="register-password">Contraseña</label>
              <input
                id="register-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="error auth-error" role="alert">
                {error}
              </div>
            )}

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Creando cuenta..." : "Registrarme"}
            </button>
          </form>

          <p className="auth-form-card__footer">
            ¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link>
          </p>
        </div>
      </main>
    </div>
  );
}