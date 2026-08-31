import type { TriangleResponse, CircleResponse, RegularPolygonResponse } from "../api/client";

const VIEW_SIZE = 280;
const PADDING = 30;

export function TriangleFigure({ data }: { data: TriangleResponse }) {
  if (!data.valid || !data.sides || !data.angles) return null;
  const [a, b, c] = data.sides;
  const angleARad = (data.angles[0] * Math.PI) / 180;

  // P1 en el origen, P2 sobre el eje x a distancia c, P3 por ley de cosenos
  const p1 = { x: 0, y: 0 };
  const p2 = { x: c, y: 0 };
  const p3 = { x: b * Math.cos(angleARad), y: b * Math.sin(angleARad) };
  const points = [p1, p2, p3];

  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const scale = (VIEW_SIZE - PADDING * 2) / Math.max(maxX - minX || 1, maxY - minY || 1);

  const toSvg = (p: { x: number; y: number }) => ({
    x: PADDING + (p.x - minX) * scale,
    y: VIEW_SIZE - PADDING - (p.y - minY) * scale, // invertimos Y para que quede "para arriba"
  });

  const [sp1, sp2, sp3] = points.map(toSvg);
  const pathData = `M ${sp1.x} ${sp1.y} L ${sp2.x} ${sp2.y} L ${sp3.x} ${sp3.y} Z`;

  const centroid = { x: (sp1.x + sp2.x + sp3.x) / 3, y: (sp1.y + sp2.y + sp3.y) / 3 };
  const labelPos = (p: { x: number; y: number }) => {
    const dx = p.x - centroid.x, dy = p.y - centroid.y;
    const len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: p.x + (dx / len) * 18, y: p.y + (dy / len) * 18 };
  };

  return (
    <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} width="100%" height="280" style={{ maxWidth: 320 }}>
      <path d={pathData} fill="#4f46e5" fillOpacity={0.12} stroke="#4f46e5" strokeWidth={2} />
      {[{ p: sp1, t: "A" }, { p: sp2, t: "B" }, { p: sp3, t: "C" }].map(({ p, t }, i) => {
        const pos = labelPos(p);
        return (
          <text key={i} x={pos.x} y={pos.y} fontSize={14} fontWeight={600} fill="#312e81" textAnchor="middle">
            {t}
          </text>
        );
      })}
      <text x={(sp1.x + sp2.x) / 2} y={(sp1.y + sp2.y) / 2 + 16} fontSize={12} fill="#4b5563" textAnchor="middle">c = {c}</text>
      <text x={(sp2.x + sp3.x) / 2 + 12} y={(sp2.y + sp3.y) / 2} fontSize={12} fill="#4b5563">a = {a}</text>
      <text x={(sp1.x + sp3.x) / 2 - 12} y={(sp1.y + sp3.y) / 2} fontSize={12} fill="#4b5563" textAnchor="end">b = {b}</text>
    </svg>
  );
}

export function CircleFigure({ data }: { data: CircleResponse }) {
  const R = (VIEW_SIZE - PADDING * 2) / 2;
  const cx = VIEW_SIZE / 2, cy = VIEW_SIZE / 2;

  return (
    <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} width="100%" height="280" style={{ maxWidth: 320 }}>
      <circle cx={cx} cy={cy} r={R} fill="#4f46e5" fillOpacity={0.12} stroke="#4f46e5" strokeWidth={2} />
      <line x1={cx} y1={cy} x2={cx + R} y2={cy} stroke="#312e81" strokeWidth={1.5} strokeDasharray="4 3" />
      <circle cx={cx} cy={cy} r={2.5} fill="#312e81" />
      <text x={cx + R / 2} y={cy - 8} fontSize={13} fill="#312e81" textAnchor="middle">r = {data.radius}</text>
    </svg>
  );
}

export function PolygonFigure({ data }: { data: RegularPolygonResponse }) {
  const cx = VIEW_SIZE / 2, cy = VIEW_SIZE / 2;
  const R = (VIEW_SIZE - PADDING * 2) / 2;

  const points = Array.from({ length: data.num_sides }, (_, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / data.num_sides;
    return { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  const pathData = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox={`0 0 ${VIEW_SIZE} ${VIEW_SIZE}`} width="100%" height="280" style={{ maxWidth: 320 }}>
      <path d={pathData} fill="#4f46e5" fillOpacity={0.12} stroke="#4f46e5" strokeWidth={2} />
      {points.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={3} fill="#312e81" />)}
      <text x={cx} y={cy + 4} fontSize={12} fill="#312e81" textAnchor="middle">{data.num_sides} lados</text>
    </svg>
  );
}