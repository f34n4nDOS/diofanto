import { useState, useRef, useEffect } from "react";
import "./GeometryConstructor.css";

interface GPoint {
  id: string;
  x: number;
  y: number;
  label: string;
}

type ToolType =
  | "select"
  | "point"
  | "line"
  | "circle"
  | "polygon"
  | "triangle"
  | "regularPolygon"
  | "midpoint"
  | "perpendicular"
  | "parallel"
  | "ruler"
  | "angle"
  | "reflect"
  | "rotate"
  | "translate"
  | "freehand"
  | "eraser";

type GShape =
  | { id: string; type: "line"; pointIds: [string, string] }
  | { id: string; type: "circle"; centerId: string; edgeId: string }
  | { id: string; type: "polygon"; pointIds: string[] }
  | { id: string; type: "angle"; pointIds: [string, string, string] } // [rayA, vértice, rayC]
  | { id: string; type: "measurement"; pointIds: [string, string] } // regla, no es una recta "de verdad"
  | { id: string; type: "freehand"; path: { x: number; y: number }[] };

interface TransformState {
  shapeId: string | null;
  refLineId: string | null;
  centerPointId: string | null;
  vectorStartId: string | null;
}

const VIEW_W = 760;
const VIEW_H = 460;
const GRID_SIZE = 40;
const SNAP_RADIUS = 14;
const EMPTY_TRANSFORM: TransformState = { shapeId: null, refLineId: null, centerPointId: null, vectorStartId: null };

const TOOL_GROUPS: { title: string; tools: { id: ToolType; icon: string; label: string }[] }[] = [
  {
    title: "Construcción",
    tools: [
      { id: "select", icon: "🖐️", label: "Mover" },
      { id: "point", icon: "•", label: "Punto" },
      { id: "line", icon: "／", label: "Recta" },
      { id: "circle", icon: "◯", label: "Círculo" },
      { id: "polygon", icon: "▱", label: "Polígono" },
      { id: "triangle", icon: "△", label: "Triángulo" },
      { id: "regularPolygon", icon: "⬡", label: "Polígono regular" },
      { id: "midpoint", icon: "⊙", label: "Punto medio" },
      { id: "perpendicular", icon: "⟂", label: "Perpendicular" },
      { id: "parallel", icon: "∥", label: "Paralela" },
    ],
  },
  {
    title: "Medición",
    tools: [
      { id: "ruler", icon: "📏", label: "Regla" },
      { id: "angle", icon: "∠", label: "Ángulo" },
    ],
  },
  {
    title: "Transformar",
    tools: [
      { id: "reflect", icon: "⇋", label: "Reflejar" },
      { id: "rotate", icon: "↻", label: "Rotar" },
      { id: "translate", icon: "➤", label: "Trasladar" },
    ],
  },
  {
    title: "Otras",
    tools: [
      { id: "freehand", icon: "✏️", label: "Mano alzada" },
      { id: "eraser", icon: "🧹", label: "Borrar" },
    ],
  },
];

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function toUnits(px: number): string {
  return (px / GRID_SIZE).toFixed(2);
}

function generateLabel(index: number): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < 26) return letters[index];
  return letters[index % 26] + Math.floor(index / 26);
}

function pathToD(path: { x: number; y: number }[]): string {
  if (path.length === 0) return "";
  return path.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

function polygonPerimeter(pts: GPoint[]): number {
  let per = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    per += dist(pts[i], pts[j]);
  }
  return per;
}

function polygonArea(pts: GPoint[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

// Ángulo sin signo (0-180°) en el vértice b, formado por los rayos b->a y b->c.
function angleAtVertex(a: GPoint, b: GPoint, c: GPoint): number {
  const v1 = { x: a.x - b.x, y: a.y - b.y };
  const v2 = { x: c.x - b.x, y: c.y - b.y };
  const dot = v1.x * v2.x + v1.y * v2.y;
  const det = v1.x * v2.y - v1.y * v2.x;
  return (Math.atan2(Math.abs(det), dot) * 180) / Math.PI;
}

function reflectAcrossLine(p: { x: number; y: number }, a: GPoint, b: GPoint) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy || 1;
  const t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
  const projX = a.x + t * dx;
  const projY = a.y + t * dy;
  return { x: 2 * projX - p.x, y: 2 * projY - p.y };
}

export default function GeometryConstructor() {
  const [points, setPoints] = useState<GPoint[]>([]);
  const [shapes, setShapes] = useState<GShape[]>([]);
  const [tool, setTool] = useState<ToolType>("point");
  const [pendingPoints, setPendingPoints] = useState<string[]>([]);
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const [freehandPath, setFreehandPath] = useState<{ x: number; y: number }[] | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [history, setHistory] = useState<{ points: GPoint[]; shapes: GShape[] }[]>([]);
  const [regularPolygonSides, setRegularPolygonSides] = useState(5);
  const [rotateAngle, setRotateAngle] = useState("45");
  const [transformState, setTransformState] = useState<TransformState>(EMPTY_TRANSFORM);

  const svgRef = useRef<SVGSVGElement>(null);

  function getPoint(id?: string): GPoint | undefined {
    return points.find((p) => p.id === id);
  }

  function findNearbyPoint(x: number, y: number): GPoint | undefined {
    return points.find((p) => dist(p, { x, y }) <= SNAP_RADIUS);
  }

  function getSvgCoords(clientX: number, clientY: number): { x: number; y: number } {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const rect = svg.getBoundingClientRect();
    const scaleX = VIEW_W / rect.width;
    const scaleY = VIEW_H / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  function pushHistory() {
    setHistory((h) => [...h, { points, shapes }]);
  }

  function handleUndo() {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPoints(prev.points);
      setShapes(prev.shapes);
      return h.slice(0, -1);
    });
  }

  function handleClearAll() {
    pushHistory();
    setPoints([]);
    setShapes([]);
    setPendingPoints([]);
    setTransformState(EMPTY_TRANSFORM);
  }

  function selectTool(t: ToolType) {
    setTool(t);
    setPendingPoints([]);
    setFreehandPath(null);
    setTransformState(EMPTY_TRANSFORM);
  }

  const TRANSFORM_TOOLS: ToolType[] = ["reflect", "rotate", "translate"];
  const CANVAS_BLIND_TOOLS: ToolType[] = ["select", "freehand", "reflect", "rotate", "translate"];

  function handleCanvasClick(e: React.MouseEvent<SVGSVGElement>) {
    if (CANVAS_BLIND_TOOLS.includes(tool)) return;

    const coords = getSvgCoords(e.clientX, e.clientY);
    const nearby = findNearbyPoint(coords.x, coords.y);

    if (tool === "point") {
      if (nearby) return;
      pushHistory();
      const label = generateLabel(points.length);
      setPoints([...points, { id: uid(), x: coords.x, y: coords.y, label }]);
      return;
    }

    if (tool === "eraser") {
      pushHistory();
      if (nearby) {
        setPoints(points.filter((p) => p.id !== nearby.id));
        setShapes(
          shapes.filter((s) => {
            if (s.type === "line" || s.type === "angle" || s.type === "measurement" || s.type === "polygon") {
              return !s.pointIds.includes(nearby.id);
            }
            if (s.type === "circle") return s.centerId !== nearby.id && s.edgeId !== nearby.id;
            return true;
          })
        );
        return;
      }
      const freehandHit = shapes.find(
        (s) => s.type === "freehand" && s.path.some((p) => dist(p, coords) < 10)
      );
      if (freehandHit) {
        setShapes(shapes.filter((s) => s.id !== freehandHit.id));
      }
      return;
    }

    // Perpendicular / paralela: primero hay que elegir una recta de referencia
    // haciendo click sobre ella (ver handleShapeClick). Sin eso, un click en el
    // lienzo vacío no hace nada.
    if (tool === "perpendicular" || tool === "parallel") {
      if (!transformState.refLineId) return;
      const refLine = shapes.find((s) => s.id === transformState.refLineId);
      if (!refLine || refLine.type !== "line") {
        setTransformState(EMPTY_TRANSFORM);
        return;
      }
      const a = getPoint(refLine.pointIds[0]);
      const b = getPoint(refLine.pointIds[1]);
      if (!a || !b) return;

      let pointId: string;
      let updatedPoints = points;
      if (nearby) {
        pointId = nearby.id;
      } else {
        const label = generateLabel(points.length);
        const newPoint: GPoint = { id: uid(), x: coords.x, y: coords.y, label };
        updatedPoints = [...points, newPoint];
        pointId = newPoint.id;
      }
      const through = updatedPoints.find((p) => p.id === pointId)!;

      let dx = b.x - a.x;
      let dy = b.y - a.y;
      if (tool === "perpendicular") {
        const ndx = -dy;
        const ndy = dx;
        dx = ndx;
        dy = ndy;
      }
      const len = Math.hypot(dx, dy) || 1;
      const ux = dx / len;
      const uy = dy / len;
      const extend = 160;

      pushHistory();
      const p1: GPoint = { id: uid(), x: through.x - ux * extend, y: through.y - uy * extend, label: generateLabel(updatedPoints.length) };
      const p2: GPoint = { id: uid(), x: through.x + ux * extend, y: through.y + uy * extend, label: generateLabel(updatedPoints.length + 1) };
      setPoints([...updatedPoints, p1, p2]);
      setShapes([...shapes, { id: uid(), type: "line", pointIds: [p1.id, p2.id] }]);
      setTransformState(EMPTY_TRANSFORM);
      return;
    }

    // Resolver el punto (existente o nuevo) para las herramientas que se
    // arman con N clicks sobre el lienzo.
    let pointId: string;
    let updatedPoints = points;
    if (nearby) {
      pointId = nearby.id;
    } else {
      const label = generateLabel(points.length);
      const newPoint: GPoint = { id: uid(), x: coords.x, y: coords.y, label };
      updatedPoints = [...points, newPoint];
      pointId = newPoint.id;
    }

    if (tool === "regularPolygon") {
      pushHistory();
      const center = updatedPoints.find((p) => p.id === pointId)!;
      const n = Math.min(12, Math.max(3, regularPolygonSides));
      const radius = 90;
      const newPts: GPoint[] = [];
      for (let i = 0; i < n; i++) {
        const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
        newPts.push({
          id: uid(),
          x: center.x + radius * Math.cos(angle),
          y: center.y + radius * Math.sin(angle),
          label: generateLabel(updatedPoints.length + i),
        });
      }
      setPoints([...updatedPoints, ...newPts]);
      setShapes([...shapes, { id: uid(), type: "polygon", pointIds: newPts.map((p) => p.id) }]);
      return;
    }

    if (tool === "line") {
      pushHistory();
      setPoints(updatedPoints);
      const next = [...pendingPoints, pointId];
      if (next.length === 2) {
        setShapes([...shapes, { id: uid(), type: "line", pointIds: [next[0], next[1]] }]);
        setPendingPoints([]);
      } else {
        setPendingPoints(next);
      }
      return;
    }

    if (tool === "circle") {
      pushHistory();
      setPoints(updatedPoints);
      const next = [...pendingPoints, pointId];
      if (next.length === 2) {
        setShapes([...shapes, { id: uid(), type: "circle", centerId: next[0], edgeId: next[1] }]);
        setPendingPoints([]);
      } else {
        setPendingPoints(next);
      }
      return;
    }

    if (tool === "polygon") {
      pushHistory();
      setPoints(updatedPoints);
      if (pendingPoints.length >= 3 && nearby && nearby.id === pendingPoints[0]) {
        setShapes([...shapes, { id: uid(), type: "polygon", pointIds: pendingPoints }]);
        setPendingPoints([]);
        return;
      }
      setPendingPoints([...pendingPoints, pointId]);
      return;
    }

    if (tool === "triangle") {
      pushHistory();
      setPoints(updatedPoints);
      const next = [...pendingPoints, pointId];
      if (next.length === 3) {
        setShapes([...shapes, { id: uid(), type: "polygon", pointIds: next }]);
        setPendingPoints([]);
      } else {
        setPendingPoints(next);
      }
      return;
    }

    if (tool === "midpoint") {
      pushHistory();
      setPoints(updatedPoints);
      const next = [...pendingPoints, pointId];
      if (next.length === 2) {
        const a = updatedPoints.find((p) => p.id === next[0])!;
        const b = updatedPoints.find((p) => p.id === next[1])!;
        const mid: GPoint = {
          id: uid(),
          x: (a.x + b.x) / 2,
          y: (a.y + b.y) / 2,
          label: generateLabel(updatedPoints.length),
        };
        setPoints([...updatedPoints, mid]);
        setPendingPoints([]);
      } else {
        setPendingPoints(next);
      }
      return;
    }

    if (tool === "ruler") {
      pushHistory();
      setPoints(updatedPoints);
      const next = [...pendingPoints, pointId];
      if (next.length === 2) {
        setShapes([...shapes, { id: uid(), type: "measurement", pointIds: [next[0], next[1]] }]);
        setPendingPoints([]);
      } else {
        setPendingPoints(next);
      }
      return;
    }

    if (tool === "angle") {
      pushHistory();
      setPoints(updatedPoints);
      const next = [...pendingPoints, pointId];
      if (next.length === 3) {
        setShapes([...shapes, { id: uid(), type: "angle", pointIds: [next[0], next[1], next[2]] }]);
        setPendingPoints([]);
      } else {
        setPendingPoints(next);
      }
      return;
    }
  }

  function handleMouseDown(e: React.MouseEvent<SVGSVGElement>) {
    if (tool !== "freehand") return;
    const coords = getSvgCoords(e.clientX, e.clientY);
    setFreehandPath([coords]);
  }

  function handleMouseMoveSvg(e: React.MouseEvent<SVGSVGElement>) {
    const coords = getSvgCoords(e.clientX, e.clientY);
    setMousePos(coords);
    if (tool === "freehand" && freehandPath) {
      setFreehandPath([...freehandPath, coords]);
    }
  }

  function handleMouseUp() {
    if (tool === "freehand" && freehandPath && freehandPath.length > 1) {
      pushHistory();
      setShapes((prev) => [...prev, { id: uid(), type: "freehand", path: freehandPath }]);
    }
    setFreehandPath(null);
  }

  useEffect(() => {
    if (!draggingPointId) return;
    function onMove(e: MouseEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const scaleX = VIEW_W / rect.width;
      const scaleY = VIEW_H / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setPoints((prev) => prev.map((p) => (p.id === draggingPointId ? { ...p, x, y } : p)));
    }
    function onUp() {
      setDraggingPointId(null);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [draggingPointId]);

  // ---------- Transformaciones: reflejar / rotar / trasladar ----------

  function getShapePointIds(shape: GShape): string[] {
    if (shape.type === "line" || shape.type === "polygon" || shape.type === "angle" || shape.type === "measurement") {
      return shape.pointIds;
    }
    if (shape.type === "circle") return [shape.centerId, shape.edgeId];
    return [];
  }

  function applyTransformCopy(shapeId: string, transformFn: (p: { x: number; y: number }) => { x: number; y: number }) {
    const shape = shapes.find((s) => s.id === shapeId);
    if (!shape) return;
    pushHistory();

    if (shape.type === "freehand") {
      const newPath = shape.path.map(transformFn);
      setShapes((prev) => [...prev, { id: uid(), type: "freehand", path: newPath }]);
      return;
    }

    const origIds = getShapePointIds(shape);
    const idMap: Record<string, string> = {};
    const newPts: GPoint[] = [];
    origIds.forEach((pid, i) => {
      const orig = getPoint(pid);
      if (!orig) return;
      const t = transformFn(orig);
      const newId = uid();
      idMap[pid] = newId;
      newPts.push({ id: newId, x: t.x, y: t.y, label: generateLabel(points.length + i) });
    });
    setPoints((prev) => [...prev, ...newPts]);

    let newShape: GShape;
    if (shape.type === "line") newShape = { id: uid(), type: "line", pointIds: [idMap[shape.pointIds[0]], idMap[shape.pointIds[1]]] };
    else if (shape.type === "circle") newShape = { id: uid(), type: "circle", centerId: idMap[shape.centerId], edgeId: idMap[shape.edgeId] };
    else if (shape.type === "polygon") newShape = { id: uid(), type: "polygon", pointIds: shape.pointIds.map((pid) => idMap[pid]) };
    else return; // no tiene sentido transformar un ángulo/regla como figura nueva
    setShapes((prev) => [...prev, newShape]);
  }

  function applyReflect(shapeId: string, axisLineId: string) {
    const axis = shapes.find((s) => s.id === axisLineId);
    if (!axis || axis.type !== "line") return;
    const a = getPoint(axis.pointIds[0]);
    const b = getPoint(axis.pointIds[1]);
    if (!a || !b) return;
    applyTransformCopy(shapeId, (p) => reflectAcrossLine(p, a, b));
    setTransformState(EMPTY_TRANSFORM);
  }

  function applyRotate() {
    if (!transformState.shapeId || !transformState.centerPointId) return;
    const center = getPoint(transformState.centerPointId);
    if (!center) return;
    const angleRad = (parseFloat(rotateAngle) || 0) * (Math.PI / 180);
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    applyTransformCopy(transformState.shapeId, (p) => {
      const dx = p.x - center.x;
      const dy = p.y - center.y;
      return { x: center.x + dx * cos - dy * sin, y: center.y + dx * sin + dy * cos };
    });
    setTransformState(EMPTY_TRANSFORM);
  }

  function applyTranslate(shapeId: string, startId: string, endId: string) {
    const start = getPoint(startId);
    const end = getPoint(endId);
    if (!start || !end) return;
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    applyTransformCopy(shapeId, (p) => ({ x: p.x + dx, y: p.y + dy }));
    setTransformState(EMPTY_TRANSFORM);
  }

  function handleShapeClick(shape: GShape) {
    if (tool === "reflect") {
      if (!transformState.shapeId) {
        setTransformState((s) => ({ ...s, shapeId: shape.id }));
        return;
      }
      if (!transformState.refLineId && shape.type === "line" && shape.id !== transformState.shapeId) {
        applyReflect(transformState.shapeId, shape.id);
      }
      return;
    }
    if (tool === "rotate" || tool === "translate") {
      if (!transformState.shapeId) {
        setTransformState((s) => ({ ...s, shapeId: shape.id }));
      }
      return;
    }
    if ((tool === "perpendicular" || tool === "parallel") && shape.type === "line") {
      setTransformState((s) => ({ ...s, refLineId: shape.id }));
    }
  }

  function handlePointClickForTools(pointId: string) {
    if (tool === "rotate" && transformState.shapeId && !transformState.centerPointId) {
      setTransformState((s) => ({ ...s, centerPointId: pointId }));
    } else if (tool === "translate" && transformState.shapeId) {
      if (!transformState.vectorStartId) {
        setTransformState((s) => ({ ...s, vectorStartId: pointId }));
      } else {
        applyTranslate(transformState.shapeId, transformState.vectorStartId, pointId);
      }
    }
  }

  function getHint(): string {
    if (tool === "reflect") {
      if (!transformState.shapeId) return "Hacé click sobre la figura que querés reflejar.";
      return "Ahora hacé click sobre la recta que va a ser el eje de simetría.";
    }
    if (tool === "rotate") {
      if (!transformState.shapeId) return "Hacé click sobre la figura que querés rotar.";
      if (!transformState.centerPointId) return "Hacé click en el punto que va a ser el centro de rotación.";
      return "Elegí el ángulo (en sentido horario) y aplicá la rotación.";
    }
    if (tool === "translate") {
      if (!transformState.shapeId) return "Hacé click sobre la figura que querés trasladar.";
      if (!transformState.vectorStartId) return "Hacé click en el punto de inicio del vector de traslación.";
      return "Hacé click en el punto final del vector para aplicar la traslación.";
    }
    if (tool === "perpendicular") {
      if (!transformState.refLineId) return "Hacé click sobre la recta de referencia.";
      return "Ahora hacé click en el punto por donde tiene que pasar la perpendicular.";
    }
    if (tool === "parallel") {
      if (!transformState.refLineId) return "Hacé click sobre la recta de referencia.";
      return "Ahora hacé click en el punto por donde tiene que pasar la paralela.";
    }
    const HINTS: Record<ToolType, string> = {
      select: "Arrastrá cualquier punto para moverlo. Las figuras conectadas se actualizan solas.",
      point: "Hacé click en el lienzo para agregar un punto.",
      line: "Hacé click en dos puntos (o en el lienzo vacío) para trazar un segmento entre ellos.",
      circle: "Hacé click en el centro y después en un punto del borde para definir el radio.",
      polygon: "Hacé click en cada vértice. Para cerrar la figura, hacé click de nuevo sobre el primer punto (mínimo 3 vértices).",
      triangle: "Hacé click en 3 puntos: el triángulo se cierra solo al tercero.",
      regularPolygon: "Elegí la cantidad de lados abajo y hacé click en el lienzo para ubicar el centro.",
      midpoint: "Hacé click en dos puntos: se agrega un punto nuevo justo en el medio.",
      perpendicular: "",
      parallel: "",
      ruler: "Hacé click en dos puntos para medir la distancia (se marca liviano, no es una recta de construcción).",
      angle: "Hacé click en 3 puntos: el primero y el tercero son los rayos, el del medio es el vértice del ángulo.",
      reflect: "",
      rotate: "",
      translate: "",
      freehand: "Mantené presionado el botón del mouse y arrastrá para dibujar libremente.",
      eraser: "Hacé click sobre un punto o un trazo libre para borrarlo.",
    };
    return HINTS[tool];
  }

  function describeShape(shape: GShape): string {
    if (shape.type === "line") {
      const a = getPoint(shape.pointIds[0]);
      const b = getPoint(shape.pointIds[1]);
      if (!a || !b) return "Segmento";
      return `Segmento ${a.label}${b.label}: longitud ${toUnits(dist(a, b))} u`;
    }
    if (shape.type === "circle") {
      const c = getPoint(shape.centerId);
      const e = getPoint(shape.edgeId);
      if (!c || !e) return "Círculo";
      const r = dist(c, e);
      const areaUnits = (Math.PI * (r / GRID_SIZE) * (r / GRID_SIZE)).toFixed(2);
      return `Círculo centro ${c.label}: radio ${toUnits(r)} u, área ${areaUnits} u²`;
    }
    if (shape.type === "polygon") {
      const pts = shape.pointIds.map(getPoint).filter(Boolean) as GPoint[];
      if (pts.length < 3) return "Polígono";
      const labels = pts.map((p) => p.label).join("");
      const perimeter = (polygonPerimeter(pts) / GRID_SIZE).toFixed(2);
      const area = (polygonArea(pts) / (GRID_SIZE * GRID_SIZE)).toFixed(2);
      if (pts.length === 3) {
        const angA = angleAtVertex(pts[2], pts[0], pts[1]).toFixed(1);
        const angB = angleAtVertex(pts[0], pts[1], pts[2]).toFixed(1);
        const angC = angleAtVertex(pts[1], pts[2], pts[0]).toFixed(1);
        return `Triángulo ${labels}: perímetro ${perimeter} u, área ${area} u², ángulos ${angA}°/${angB}°/${angC}°`;
      }
      return `Polígono ${labels}: perímetro ${perimeter} u, área ${area} u²`;
    }
    if (shape.type === "angle") {
      const [a, b, c] = shape.pointIds.map(getPoint);
      if (!a || !b || !c) return "Ángulo";
      return `Ángulo ${a.label}${b.label}${c.label}: ${angleAtVertex(a, b, c).toFixed(1)}°`;
    }
    if (shape.type === "measurement") {
      const a = getPoint(shape.pointIds[0]);
      const b = getPoint(shape.pointIds[1]);
      if (!a || !b) return "Medición";
      return `Medición ${a.label}-${b.label}: ${toUnits(dist(a, b))} u`;
    }
    return "Trazo libre";
  }

  function shapeHighlightStyle(shape: GShape): React.CSSProperties | undefined {
    if (transformState.shapeId === shape.id) {
      return { filter: "drop-shadow(0 0 4px var(--spark))" };
    }
    return undefined;
  }

  function shapeClickable(shapeType: GShape["type"]): boolean {
    if (TRANSFORM_TOOLS.includes(tool)) return true;
    if ((tool === "perpendicular" || tool === "parallel") && shapeType === "line") return true;
    return false;
  }

  function renderShape(shape: GShape) {
    const clickable = shapeClickable(shape.type);
    const shapeProps = clickable
      ? {
          onClick: (e: React.MouseEvent) => {
            e.stopPropagation();
            handleShapeClick(shape);
          },
          style: { cursor: "pointer", ...shapeHighlightStyle(shape) },
        }
      : { style: shapeHighlightStyle(shape) };

    if (shape.type === "line") {
      const a = getPoint(shape.pointIds[0]);
      const b = getPoint(shape.pointIds[1]);
      if (!a || !b) return null;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return (
        <g key={shape.id} {...shapeProps}>
          {/* hitbox invisible más ancha, para que sea fácil hacer click sobre la recta */}
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="transparent" strokeWidth={14} />
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--subject-geometry)" strokeWidth={2.5} />
          <text x={mid.x + 6} y={mid.y - 6} fontSize={12} fill="var(--neutral-600)">
            {toUnits(dist(a, b))} u
          </text>
        </g>
      );
    }
    if (shape.type === "circle") {
      const c = getPoint(shape.centerId);
      const e = getPoint(shape.edgeId);
      if (!c || !e) return null;
      const r = dist(c, e);
      return (
        <g key={shape.id} {...shapeProps}>
          <circle cx={c.x} cy={c.y} r={r} fill="var(--subject-geometry)" fillOpacity={0.08} stroke="var(--subject-geometry)" strokeWidth={2.5} />
          <line x1={c.x} y1={c.y} x2={e.x} y2={e.y} stroke="var(--subject-geometry)" strokeDasharray="4 3" strokeWidth={1.5} />
          <text x={c.x + 8} y={c.y - 8} fontSize={12} fill="var(--neutral-600)">
            r = {toUnits(r)} u
          </text>
        </g>
      );
    }
    if (shape.type === "polygon") {
      const pts = shape.pointIds.map(getPoint).filter(Boolean) as GPoint[];
      if (pts.length < 3) return null;
      const centroid = {
        x: pts.reduce((s, p) => s + p.x, 0) / pts.length,
        y: pts.reduce((s, p) => s + p.y, 0) / pts.length,
      };
      return (
        <g key={shape.id} {...shapeProps}>
          <polygon
            points={pts.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="var(--subject-algebra)"
            fillOpacity={0.1}
            stroke="var(--subject-algebra)"
            strokeWidth={2.5}
          />
          <text x={centroid.x} y={centroid.y} fontSize={12} fill="var(--neutral-600)" textAnchor="middle">
            {pts.length === 3 ? "△" : `${pts.length} lados`}
          </text>
        </g>
      );
    }
    if (shape.type === "angle") {
      const [a, b, c] = shape.pointIds.map(getPoint);
      if (!a || !b || !c) return null;
      const radius = 26;
      const angle1 = Math.atan2(a.y - b.y, a.x - b.x);
      const angle2 = Math.atan2(c.y - b.y, c.x - b.x);
      const start = { x: b.x + radius * Math.cos(angle1), y: b.y + radius * Math.sin(angle1) };
      const end = { x: b.x + radius * Math.cos(angle2), y: b.y + radius * Math.sin(angle2) };
      const det = (a.x - b.x) * (c.y - b.y) - (a.y - b.y) * (c.x - b.x);
      const sweepFlag = det >= 0 ? 1 : 0;
      const midAngle = (angle1 + angle2) / 2;
      const labelPos = { x: b.x + (radius + 16) * Math.cos(midAngle), y: b.y + (radius + 16) * Math.sin(midAngle) };
      return (
        <g key={shape.id}>
          <path
            d={`M ${start.x} ${start.y} A ${radius} ${radius} 0 0 ${sweepFlag} ${end.x} ${end.y}`}
            fill="none"
            stroke="var(--spark-dark)"
            strokeWidth={2}
          />
          <text x={labelPos.x} y={labelPos.y} fontSize={12} fill="var(--spark-dark)" textAnchor="middle">
            {angleAtVertex(a, b, c).toFixed(1)}°
          </text>
        </g>
      );
    }
    if (shape.type === "measurement") {
      const a = getPoint(shape.pointIds[0]);
      const b = getPoint(shape.pointIds[1]);
      if (!a || !b) return null;
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      return (
        <g key={shape.id}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--neutral-400)" strokeWidth={1.5} strokeDasharray="3 3" />
          <text x={mid.x + 6} y={mid.y - 6} fontSize={12} fill="var(--neutral-500)" fontStyle="italic">
            {toUnits(dist(a, b))} u
          </text>
        </g>
      );
    }
    return (
      <path
        key={shape.id}
        d={pathToD(shape.path)}
        stroke="var(--spark-dark)"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  }

  const showRegularPolygonInput = tool === "regularPolygon";
  const showRotateForm = tool === "rotate" && transformState.shapeId && transformState.centerPointId;

  return (
    <div className="geo-constructor">
      <div className="geo-constructor__toolbar">
        {TOOL_GROUPS.map((group) => (
          <div key={group.title} className="geo-constructor__tool-group">
            <span className="geo-constructor__group-label">{group.title}</span>
            <div className="geo-constructor__group-buttons">
              {group.tools.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`tab-button ${tool === t.id ? "active" : ""}`}
                  onClick={() => selectTool(t.id)}
                >
                  <span aria-hidden="true">{t.icon}</span> {t.label}
                </button>
              ))}
            </div>
          </div>
        ))}

        <div className="geo-constructor__actions">
          <button type="button" className="button-ghost" onClick={handleUndo} disabled={history.length === 0}>
            ↶ Deshacer
          </button>
          <button type="button" className="button-ghost" onClick={handleClearAll}>
            🗑️ Limpiar todo
          </button>
          <label className="geo-constructor__grid-toggle">
            <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
            Cuadrícula
          </label>
        </div>
      </div>

      {showRegularPolygonInput && (
        <div className="geo-constructor__inline-form">
          <label>Lados</label>
          <input
            type="number"
            min={3}
            max={12}
            value={regularPolygonSides}
            onChange={(e) => setRegularPolygonSides(parseInt(e.target.value) || 3)}
          />
        </div>
      )}

      {showRotateForm && (
        <div className="geo-constructor__inline-form">
          <label>Ángulo (°, sentido horario)</label>
          <input type="number" value={rotateAngle} onChange={(e) => setRotateAngle(e.target.value)} />
          <button type="button" className="submit-btn" onClick={applyRotate}>
            Aplicar rotación
          </button>
        </div>
      )}

      <p className="geo-constructor__hint">{getHint()}</p>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="geo-constructor__canvas"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMoveSvg}
        onMouseUp={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {showGrid && (
          <>
            <defs>
              <pattern id="geo-grid" width={GRID_SIZE} height={GRID_SIZE} patternUnits="userSpaceOnUse">
                <path d={`M ${GRID_SIZE} 0 L 0 0 0 ${GRID_SIZE}`} fill="none" stroke="var(--grid-line)" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#geo-grid)" />
          </>
        )}

        {shapes.map(renderShape)}

        {pendingPoints.length > 0 && mousePos && ["line", "circle", "polygon", "triangle", "midpoint", "ruler", "angle"].includes(tool) && (
          <line
            x1={getPoint(pendingPoints[pendingPoints.length - 1])?.x}
            y1={getPoint(pendingPoints[pendingPoints.length - 1])?.y}
            x2={mousePos.x}
            y2={mousePos.y}
            stroke="var(--neutral-400)"
            strokeDasharray="4 4"
          />
        )}

        {freehandPath && (
          <path d={pathToD(freehandPath)} stroke="var(--spark-dark)" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        )}

        {points.map((p) => (
          <g
            key={p.id}
            onMouseDown={(e) => {
              e.stopPropagation();
              if (tool === "select") {
                pushHistory();
                setDraggingPointId(p.id);
              }
            }}
            onClick={(e) => {
              if (tool === "rotate" || tool === "translate") {
                e.stopPropagation();
                handlePointClickForTools(p.id);
              }
            }}
            style={{ cursor: tool === "select" ? "grab" : tool === "rotate" || tool === "translate" ? "pointer" : "default" }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={6}
              fill={
                pendingPoints.includes(p.id) || p.id === transformState.centerPointId || p.id === transformState.vectorStartId
                  ? "var(--spark)"
                  : "var(--ink)"
              }
              stroke="white"
              strokeWidth={1.5}
            />
            <text x={p.x + 10} y={p.y - 8} fontSize={13} fontFamily="var(--font-display)" fill="var(--ink)">
              {p.label}
            </text>
          </g>
        ))}
      </svg>

      {shapes.length > 0 && (
        <div className="steps-section">
          <h4>Mediciones</h4>
          <ul className="steps-list">
            {shapes.map((s) => (
              <li key={s.id}>{describeShape(s)}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}