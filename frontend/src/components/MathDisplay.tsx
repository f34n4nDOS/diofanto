import { BlockMath, InlineMath } from "react-katex";

interface MathDisplayProps {
  latex: string;
  block?: boolean;
}

export default function MathDisplay({ latex, block = false }: MathDisplayProps) {
  try {
    return block ? <BlockMath math={latex} /> : <InlineMath math={latex} />;
  } catch {
    return <code>{latex}</code>;
  }
}