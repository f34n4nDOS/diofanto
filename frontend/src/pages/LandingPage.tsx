import { useState } from "react";
import { InlineMath, BlockMath } from "react-katex";
import "katex/dist/katex.min.css";
import {
  Calculator,
  Ruler,
  LineChart,
  TrendingUp,
  Infinity as InfinityIcon,
  Sigma,
  Dices,
  Atom,
  ArrowRight,
  Menu,
  X,
} from "lucide-react";
import "./LandingPage.css";


interface LandingPageProps {
  loginHref?: string;
  registerHref?: string;
}

interface Subject {
  name: string;
  desc: string;
  icon: typeof Calculator;
  colorVar: string;
}

const SUBJECTS: Subject[] = [
  { name: "Álgebra", desc: "Ecuaciones, sistemas, factorización, simplificación y expansión.", icon: Calculator, colorVar: "var(--subject-algebra)" },
  { name: "Geometría", desc: "Triángulos, circunferencias y polígonos regulares.", icon: Ruler, colorVar: "var(--subject-geometry)" },
  { name: "Funciones", desc: "Graficá cualquier función y mirá su derivada al lado.", icon: LineChart, colorVar: "var(--subject-calculus)" },
  { name: "Derivadas", desc: "Derivadas, puntos críticos y rectas tangentes interactivas.", icon: TrendingUp, colorVar: "var(--subject-calculus)" },
  { name: "Límites", desc: "Límites laterales, en el infinito y su interpretación gráfica.", icon: InfinityIcon, colorVar: "var(--subject-calculus)" },
  { name: "Integrales", desc: "Integrales definidas e indefinidas, paso a paso.", icon: Sigma, colorVar: "var(--subject-calculus)" },
  { name: "Probabilidad y Estadística", desc: "Distribuciones, muestreo e inferencia con ejemplos concretos.", icon: Dices, colorVar: "var(--subject-statistics)" },
  { name: "Modelaje Matemático", desc: "Construí, analizá y optimizá modelos matemáticos reales.", icon: Atom, colorVar: "var(--subject-calculus)" },
];

const METHOD = [
  { title: "Elegí un tema", desc: "Entrá a la materia que estás cursando: desde álgebra básica hasta modelaje matemático." },
  { title: "Resolvé paso a paso", desc: "Cada ejercicio se destraba en pasos, no en la respuesta final. Vos avanzás a tu ritmo." },
  { title: "Entendé el porqué", desc: "Cada paso viene con la razón detrás, para que la próxima vez lo resuelvas solo." },
];

const FORMULAS = [
  { tex: "a^2 + b^2 = c^2", caption: "Teorema de Pitágoras" },
  { tex: "e^{i\\pi} + 1 = 0", caption: "Identidad de Euler" },
  { tex: "P(A \\mid B) = \\dfrac{P(B \\mid A)\\,P(A)}{P(B)}", caption: "Regla de Bayes" },
  { tex: "f(x) = \\sum_{n=0}^{\\infty} \\dfrac{f^{(n)}(a)}{n!}(x-a)^n", caption: "Serie de Taylor" },
];

function ParabolaFigure() {
  return (
    <div className="landing-figure">
      <svg viewBox="0 0 320 200" style={{ width: "100%" }} role="img" aria-label="Gráfico de una parábola con tres puntos marcados">
        <line x1="30" y1="10" x2="30" y2="175" stroke="var(--neutral-300)" strokeWidth="1" />
        <line x1="20" y1="175" x2="300" y2="175" stroke="var(--neutral-300)" strokeWidth="1" />
        {[65, 100, 135, 170, 205, 240, 275].map((x) => (
          <line key={x} x1={x} y1="171" x2={x} y2="179" stroke="var(--neutral-300)" strokeWidth="1" />
        ))}

        <path
          id="diofanto-parabola"
          d="M 45 160 Q 160 15 285 160"
          fill="none"
          stroke="var(--acad-ink, #1b2540)"
          strokeWidth="2.5"
          pathLength={1}
          style={{ strokeDasharray: 1, strokeDashoffset: 1, animation: "diofanto-draw 1.4s ease-out 0.3s forwards" }}
        />

        <circle cx="90" cy="110" r="4" fill="var(--acad-ink, #1b2540)" />
        <circle cx="230" cy="115" r="4" fill="var(--acad-ink, #1b2540)" />
        <circle cx="160" cy="35" r="4" fill="var(--acad-gold, #b08d57)" />

        <text x="164" y="25" fontSize="13" fontFamily="var(--font-serif)" fill="var(--acad-ink)">f(x)</text>
        <text x="292" y="192" fontSize="12" fill="var(--neutral-500)">x</text>
      </svg>
      <p className="landing-figure-caption">
        Fig. 1 — Puntos críticos de <InlineMath math="f(x) = -x^2 + 2x + 3" />
      </p>
    </div>
  );
}

export default function LandingPage({ loginHref = "/login", registerHref = "/register" }: LandingPageProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="landing">
      {/* Header */}
      <header className="landing-header">
        <a href="/" className="landing-logo">Diofanto</a>

        <nav className="landing-nav">
          <a href="#temas">Temas</a>
          <a href="#metodo">Método</a>
          <a href={loginHref}>Iniciar sesión</a>
          <a href={registerHref} className="btn-primary" style={{ color: "var(--acad-panel)" }}>Crear cuenta</a>
        </nav>

        <button
          className="landing-menu-btn"
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          onClick={() => setMenuOpen((v) => !v)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </header>

      {menuOpen && (
        <div className="landing-mobile-nav">
          <a href="#temas">Temas</a>
          <a href="#metodo">Método</a>
          <a href={loginHref}>Iniciar sesión</a>
          <a href={registerHref} className="btn-primary">Crear cuenta</a>
        </div>
      )}

      {/* Hero */}
      <section className="landing-hero">
        <div className="landing-hero-grid">
          <div className="landing-hero-enter">
            
            <h1>Matemática resuelta con el mismo rigor con el que se enseña.</h1>
            <p>
              Diofanto guía la resolución de ejercicios de álgebra, cálculo,
              geometría y estadística paso a paso, mostrando el razonamiento
              completo detrás de cada resultado — no solo la respuesta final.
            </p>
            <div className="landing-hero-actions">
              <a href={registerHref} className="btn-primary">
                Crear cuenta
                <ArrowRight size={16} />
              </a>
              <a href="#temas" className="btn-ghost">Ver los temas</a>
            </div>
          </div>
          <div className="landing-hero-enter landing-hero-figure">
            <ParabolaFigure />
          </div>
        </div>
      </section>

      {/* Formula gallery */}
      <section className="landing-formulas" aria-label="Resultados que podés resolver en la plataforma">
        <div className="landing-formulas-grid">
          {FORMULAS.map((f) => (
            <div key={f.caption} className="landing-formula-card">
              <BlockMath math={f.tex} />
              <p className="landing-formula-caption">{f.caption}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects grid */}
      <section id="temas" className="landing-subjects">
        <div className="landing-container">
          <h2>Un módulo para cada área</h2>
          <p style={{ color: "var(--neutral-600)", maxWidth: "56ch" }}>
            Los mismos módulos que vas a encontrar apenas entrás a la plataforma.
          </p>

          <div className="landing-subjects-grid">
            {SUBJECTS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.name} className="landing-card" style={{ ["--card-color" as string]: s.colorVar }}>
                  <div className="landing-card-icon">
                    <Icon size={20} color={s.colorVar} strokeWidth={2} />
                  </div>
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Método */}
      <section id="metodo" className="landing-method-section">
        <div className="landing-container">
          <h2>Método</h2>
          <div className="landing-method">
            {METHOD.map((step, i) => (
              <div key={step.title} className="landing-method-item">
                <div className="landing-method-numeral">{["I", "II", "III"][i]}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Historical note */}
      <section className="landing-history">
        <div className="landing-history-card">
          <span className="landing-history-mark" aria-hidden="true">“</span>
          <blockquote>
            Diofanto de Alejandría sentó las bases del álgebra resolviendo
            problemas concretos con ecuaciones — la misma idea que sostiene
            esta plataforma: entender resolviendo, no al revés.
            <cite>Arithmetica, s. III d. C.</cite>
          </blockquote>
        </div>
      </section>

      {/* Final CTA */}
      <section className="landing-cta-wrap">
        <div className="landing-cta">
          <h2>Empezá cuando quieras, a tu ritmo.</h2>
          {/* <p>Sin costo para empezar. Cancelás cuando quieras.</p>*/}
          <a href={registerHref} className="btn-primary">
            Crear cuenta gratis
            <ArrowRight size={16} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <span className="landing-logo" style={{ fontSize: "1.05rem" }}>Diofanto</span>
          <div className="landing-footer-links">
            <a href={loginHref}>Iniciar sesión</a>
            <a href={registerHref}>Crear cuenta</a>
          </div>
          <span className="landing-logo" style={{ fontSize: "1.05rem" }}>© {new Date().getFullYear()} Desarrollado por corrientIA</span>
        </div>
      </footer>
    </div>
  );
}