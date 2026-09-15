import { useAuth } from "../context/AuthContext";
import SubjectCard, { type Subject } from "../components/SubjectCard";
import "../styles/Dashboard.css";

interface Lab {
  code: string;
  title: string;
  description: string;
  to: string;
  subject: Subject;
  icon: string;
  featured?: boolean;
}

const LABS: Lab[] = [
  {
    code: "Álg",
    title: "Álgebra",
    description: "Ecuaciones, sistemas, factorización, simplificación y expansión.",
    to: "/algebra",
    subject: "algebra",
    icon: "🧮",
  },
  {
    code: "Geo",
    title: "Geometría",
    description: "Triángulos, circunferencias y polígonos regulares.",
    to: "/geometry",
    subject: "geometry",
    icon: "📐",
  },
  {
    code: "Fn",
    title: "Funciones",
    description: "Graficá cualquier función y mirá su derivada al lado.",
    to: "/functions",
    subject: "calculus",
    icon: "📈",
  },
  {
    code: "D/dx",
    title: "Derivadas",
    description: "Derivadas, puntos críticos y rectas tangentes interactivas.",
    to: "/derivatives",
    subject: "calculus",
    icon: "🔺",
  },
  {
    code: "Lím",
    title: "Límites",
    description: "Límites laterales, en el infinito, y su interpretación.",
    to: "/limits",
    subject: "calculus",
    icon: "➰",
  },
  {
    code: "∫",
    title: "Integrales",
    description: "Integrales definidas e indefinidas paso a paso.",
    to: "/integrals",
    subject: "calculus",
    icon: "∫",
  },
  {
    code: "Prob",
    title: "Probabilidad y Estadística",
    description: "Estadística descriptiva y simulaciones de moneda y dados.",
    to: "/statistics",
    subject: "statistics",
    icon: "🎲",
  },
  {
    code: "Ejer",
    title: "Ejercicios",
    description: "Practicá, corregí tus respuestas y seguí tu progreso.",
    to: "/exercises",
    subject: "exercises",
    icon: "📝",
  },
  {
    code: "Mod",
    title: "Modelaje Matemático",
    description:
      "Construí, analizá y optimizá modelos matemáticos complejos. Incluye un intérprete con IA para partir de una consigna en lenguaje natural.",
    to: "/modeling",
    subject: "calculus",
    icon: "🧬",
    featured: true,
  },
  {
    code: "Viva",
    title: "Pizarra en vivo",
    // Antes esta tarjeta compartía por error la copy y el color de "Ejercicios".
    description: "Dibujá y resolvé problemas en tiempo real, en una pizarra compartida con quien quieras.",
    to: "/Whiteboard",
    subject: "live",
    icon: "🖊️",
    featured: true,
  },

  {
  code: "IA",
  title: "Laboratorio de IA",
  description: "Entrená regresiones, redes neuronales y modelos de lenguaje reales, y mirá cómo funcionan por dentro.",
  to: "/mllab",
  subject: "calculus",
  icon: "🤖",
  featured: true,
},
];

const AREA_COUNT = new Set(LABS.map((l) => l.subject)).size;

export default function Dashboard() {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard">
      <header className="dashboard__hero grid-paper">
        <div className="dashboard__hero-top">
          <button onClick={logout} className="button-ghost dashboard__logout">
            Cerrar sesión
          </button>
        </div>

        <div className="dashboard__hero-content">
          <h1 className="dashboard__greeting">Hola, {user?.name}</h1>
          <p className="dashboard__subtitle">¿Qué querés resolver hoy?</p>
          <p className="dashboard__readout">
            <strong>{LABS.length}</strong> laboratorios en <strong>{AREA_COUNT}</strong> áreas
          </p>
        </div>
      </header>

      <section className="dashboard__grid">
        {LABS.map((lab) => (
          <SubjectCard key={lab.to} {...lab} />
        ))}
      </section>
    </div>
  );
}