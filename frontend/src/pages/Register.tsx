import { useState, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password);
      navigate("/dashboard");
    } catch {
      setError("No se pudo registrar. ¿El email ya existe?");
    }
  }

  return (
    <div style={{ maxWidth: 320, margin: "60px auto" }}>
      <h1>Crear cuenta</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Nombre</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
        </div>
        <div>
          <label>Contraseña</label>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit">Registrarme</button>
      </form>
      <p>¿Ya tenés cuenta? <Link to="/login">Iniciar sesión</Link></p>
    </div>
  );
}