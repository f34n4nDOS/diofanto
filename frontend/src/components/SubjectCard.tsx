import { Link } from "react-router-dom";
import "./SubjectCard.css";

export type Subject = "algebra" | "geometry" | "calculus" | "statistics" | "exercises" | "live";

interface SubjectCardProps {
  code?: string;
  title: string;
  description: string;
  to: string;
  subject: Subject;
  icon: string;
  featured?: boolean;
}

export default function SubjectCard({ code, title, description, to, subject, icon, featured }: SubjectCardProps) {
  return (
    <Link
      to={to}
      className={`subject-card subject-card--${subject}${featured ? " subject-card--featured" : ""}`}
    >
      <span className="subject-card__tab" aria-hidden="true" />
      <div className="subject-card__head">
        <span className="subject-card__icon" aria-hidden="true">
          {icon}
        </span>
        {code && <span className="subject-card__code">{code}</span>}
      </div>
      <h3 className="subject-card__title">{title}</h3>
      <p className="subject-card__description">{description}</p>
      <span className="subject-card__cta">Entrar →</span>
    </Link>
  );
}