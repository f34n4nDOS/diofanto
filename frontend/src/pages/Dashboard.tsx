import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div style={{ maxWidth: 480, margin: "60px auto" }}>
      <h1>Hola, {user?.name} 👋</h1>
      <p>Email: {user?.email}</p>
      <p>Rol: {user?.role}</p>
      <p><Link to="/functions">Ir al Laboratorio de Funciones →</Link></p>
      <p><Link to="/limits">Laboratorio de Límites →</Link></p>
      <p><Link to="/integrals">Laboratorio de Integrales →</Link></p>
      <p><Link to="/algebra">Laboratorio de Álgebra →</Link></p>
      <button onClick={logout}>Cerrar sesión</button>
    </div>
  );
}