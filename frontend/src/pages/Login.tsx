import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Email o contraseña incorrectos");
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
            Resolvé, comprendé, avanzá.
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
            Diofanto de Alejandría sentó las bases del álgebra resolviendo
            problemas concretos con ecuaciones — la misma idea que sostiene
            esta plataforma.
          </p>
        </div>
      </aside>

      {/* Panel del formulario */}
      <main className="auth-form-panel">
        <div className="auth-form-card">
           <p className="auth-form-card__footer">
            <Link to="/">Volver </Link>
          </p>
          <h1 className="auth-form-card__title">Iniciar sesión</h1>
          <p className="auth-form-card__subtitle">
            Entrá con tu cuenta para seguir donde dejaste.
          </p>

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Email</label>
              <input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="nombre@ejemplo.com"
                required
              />
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Contraseña</label>
              <input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
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
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="auth-form-card__footer">
            ¿No tenés cuenta? <Link to="/register">Registrate</Link>
          </p>
        </div>
      </main>
    </div>
  );
}