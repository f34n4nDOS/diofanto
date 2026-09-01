import { Link } from "react-router-dom";
import "./SubjectCard.css";

export type Subject = "algebra" | "geometry" | "calculus" | "statistics";

interface SubjectCardProps {
  title: string;
  description: string;
  to: string;
  subject: Subject;
  icon: string;
}

export default function SubjectCard({ title, description, to, subject, icon }: SubjectCardProps) {
  return (
    <Link to={to} className={`subject-card subject-card--${subject}`}>
      <span className="subject-card__tab" aria-hidden="true" />
      <span className="subject-card__icon" aria-hidden="true">{icon}</span>
      <h3 className="subject-card__title">{title}</h3>
      <p className="subject-card__description">{description}</p>
      <span className="subject-card__cta">Entrar →</span>
    </Link>
  );
}
