import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch {
      setError("Email o contraseña incorrectos");
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: "60px auto" }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Ingresar</button>
      </form>
      <p>¿No tenés cuenta? <Link to="/register">Registrate</Link></p>
    </div>
  );
}