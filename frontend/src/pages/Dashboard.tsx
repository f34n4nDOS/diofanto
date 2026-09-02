import { useAuth } from "../context/AuthContext";
import SubjectCard, { type Subject } from "../components/SubjectCard";
import "../styles/Dashboard.css";

interface Lab {
  title: string;
  description: string;
  to: string;
  subject: Subject;
  icon: string;
}

const LABS: Lab[] = [
  {
    title: "Álgebra",
    description: "Ecuaciones, sistemas, factorización, simplificación y expansión.",
    to: "/algebra",
    subject: "algebra",
    icon: "🧮",
  },
  {
    title: "Geometría",
    description: "Triángulos, circunferencias y polígonos regulares.",
    to: "/geometry",
    subject: "geometry",
    icon: "📐",
  },
  {
    title: "Funciones",
    description: "Graficá cualquier función y mirá su derivada al lado.",
    to: "/functions",
    subject: "calculus",
    icon: "📈",
  },
  {
    title: "Derivadas",
    description: "Derivadas, puntos críticos y rectas tangentes interactivas.",
    to: "/derivatives",
    subject: "calculus",
    icon: "🔺",
  },
  {
    title: "Límites",
    description: "Límites laterales, en el infinito, y su interpretación.",
    to: "/limits",
    subject: "calculus",
    icon: "➰",
  },
  {
    title: "Integrales",
    description: "Integrales definidas e indefinidas paso a paso.",
    to: "/integrals",
    subject: "calculus",
    icon: "∫",
  },
  {
    title: "Probabilidad y Estadística",
    description: "Estadística descriptiva y simulaciones de moneda y dados.",
    to: "/statistics",
    subject: "statistics",
    icon: "🎲",
  },
  {
    title: "Modelaje Matemático",
    description: "Construye, analiza y optimiza modelos matemáticos complejos.",
    to: "/modeling",
    subject: "calculus",
    icon: "🧬",
  },
  {
    title: "Ejercicios",
    description: "Practicá, corregí tus respuestas y seguí tu progreso.",
    to: "/exercises",
    subject: "exercises",
    icon: "📝",
  },
];

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard__hero grid-paper">
        <div className="dashboard__hero-content">
          <h1 className="dashboard__greeting">Hola, {user?.name} </h1>
          <p className="dashboard__subtitle">¿Qué querés resolver hoy?</p>
        </div>
        <button onClick={logout} className="button-ghost dashboard__logout">
          Cerrar sesión
        </button>
      </header>

      <section className="dashboard__grid">
        {LABS.map((lab) => (
          <SubjectCard key={lab.to} {...lab} />
        ))}
      </section>
    </div>
  );
}
