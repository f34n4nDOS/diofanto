import { useCallback, useEffect, useRef, useState } from "react";
import MathDisplay from "./MathDisplay";

interface WhiteboardCanvasProps {
  roomCode: string;
  role: "host" | "viewer";
}

/* ============================================================
   TIPOS
   ============================================================ */

type DrawTool = "pen" | "highlighter" | "eraser";
type ShapeTool = "line" | "rect" | "circle" | "triangle" | "arrow";
type Tool = DrawTool | ShapeTool | "select" | "text" | "formula";

type GridMode = "none" | "lines" | "dots" | "axes";

interface StrokeOp {
  kind: "stroke";
  id: string;
  tool: DrawTool;
  points: { x: number; y: number }[];
  color: string;
  width: number;
}

interface ShapeOp {
  kind: "shape";
  id: string;
  shapeType: ShapeTool;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  fill: boolean;
}

interface ItemOp {
  kind: "item";
  id: string;
  itemType: "text" | "formula";
  x: number; // relativo 0-1
  y: number;
  content: string;
}

type Op = StrokeOp | ShapeOp | ItemOp;

interface Page {
  id: string;
  ops: Op[];
}

type WSMessage =
  | { type: "live-start"; pageId: string; strokeId: string; x: number; y: number; color: string; width: number; tool: DrawTool }
  | { type: "live-point"; pageId: string; strokeId: string; x: number; y: number }
  | { type: "live-end"; pageId: string; strokeId: string }
  | { type: "op-commit"; pageId: string; op: Op }
  | { type: "op-remove"; pageId: string; opId: string }
  | { type: "op-update"; pageId: string; opId: string; patch: Partial<ItemOp> }
  | { type: "clear"; pageId: string }
  | { type: "page-add"; pageId: string }
  | { type: "page-remove"; pageId: string }
  | { type: "page-switch"; pageId: string }
  | { type: "request-sync" }
  | { type: "full-sync"; pages: Page[]; currentPageId: string };

/* ============================================================
   CONSTANTES
   ============================================================ */

const COLOR_PRESETS = ["#1e2340", "#dc2626", "#16a34a", "#2563eb", "#f59e0b", "#7c3aed", "#000000", "#ffffff"];
const WIDTH_PRESETS = [2, 4, 6, 10];

const LATEX_SNIPPETS: { label: string; insert: string }[] = [
  { label: "x²", insert: "x^{2}" },
  { label: "xⁿ", insert: "x^{n}" },
  { label: "√x", insert: "\\sqrt{x}" },
  { label: "ⁿ√x", insert: "\\sqrt[n]{x}" },
  { label: "a/b", insert: "\\frac{a}{b}" },
  { label: "∫", insert: "\\int_{a}^{b} " },
  { label: "∑", insert: "\\sum_{i=1}^{n} " },
  { label: "∏", insert: "\\prod_{i=1}^{n} " },
  { label: "lim", insert: "\\lim_{x \\to \\infty} " },
  { label: "d/dx", insert: "\\frac{d}{dx}" },
  { label: "∂", insert: "\\partial " },
  { label: "π", insert: "\\pi " },
  { label: "θ", insert: "\\theta " },
  { label: "α", insert: "\\alpha " },
  { label: "β", insert: "\\beta " },
  { label: "∞", insert: "\\infty " },
  { label: "≠", insert: "\\neq " },
  { label: "≤", insert: "\\leq " },
  { label: "≥", insert: "\\geq " },
  { label: "≈", insert: "\\approx " },
  { label: "→", insert: "\\to " },
  { label: "∈", insert: "\\in " },
  { label: "∀", insert: "\\forall " },
  { label: "∃", insert: "\\exists " },
  { label: "vec", insert: "\\vec{v}" },
  { label: "matriz", insert: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}" },
  { label: "sin", insert: "\\sin(x)" },
  { label: "cos", insert: "\\cos(x)" },
  { label: "n choose k", insert: "\\binom{n}{k}" },
];

function genId() {
  return Math.random().toString(36).slice(2);
}

function isShapeTool(t: Tool): t is ShapeTool {
  return t === "line" || t === "rect" || t === "circle" || t === "triangle" || t === "arrow";
}

/* ============================================================
   COMPONENTE
   ============================================================ */

export default function WhiteboardCanvas({ roomCode, role }: WhiteboardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const gridCanvasRef = useRef<HTMLCanvasElement>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unmountedRef = useRef(false);

  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<StrokeOp | null>(null);
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);
  const lastMoveRef = useRef<{ x: number; y: number } | null>(null);
  const draggingItemRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);

  // Páginas / historial
  const [pages, setPages] = useState<Page[]>([{ id: genId(), ops: [] }]);
  const [currentPageId, setCurrentPageId] = useState(pages[0].id);
  const pagesRef = useRef(pages);
  const currentPageIdRef = useRef(currentPageId);
  const redoStackRef = useRef<Record<string, Op[]>>({});
  useEffect(() => { pagesRef.current = pages; }, [pages]);
  useEffect(() => { currentPageIdRef.current = currentPageId; }, [currentPageId]);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1e2340");
  const [brushWidth, setBrushWidth] = useState(3);
  const [fillShape, setFillShape] = useState(false);
  const [gridMode, setGridMode] = useState<GridMode>("lines");
  const [connected, setConnected] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [formulaModal, setFormulaModal] = useState<{ open: boolean; kind: "text" | "formula"; x: number; y: number; value: string }>({
    open: false, kind: "text", x: 0.5, y: 0.5, value: "",
  });

  const isHost = role === "host";

  const currentOps = pages.find((p) => p.id === currentPageId)?.ops ?? [];

  /* ---------- Helpers de canvas ---------- */

  function getCtx(ref: React.RefObject<HTMLCanvasElement | null>) {
    return ref.current?.getContext("2d") ?? null;
  }

  function relativeToAbsolute(x: number, y: number) {
    const canvas = canvasRef.current!;
    return { absX: x * canvas.width, absY: y * canvas.height };
  }

  const resizeCanvases = useCallback(() => {
    [canvasRef, previewCanvasRef, gridCanvasRef].forEach((ref) => {
      const c = ref.current;
      if (!c) return;
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    });
    drawGrid();
    redrawPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function drawGrid() {
    const grid = gridCanvasRef.current;
    const ctx = getCtx(gridCanvasRef);
    if (!grid || !ctx) return;
    ctx.clearRect(0, 0, grid.width, grid.height);
    if (gridMode === "none") return;

    const step = 32;
    ctx.strokeStyle = "#e5e7eb";
    ctx.fillStyle = "#d1d5db";
    ctx.lineWidth = 1;

    if (gridMode === "lines") {
      for (let x = 0; x <= grid.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, grid.height);
        ctx.stroke();
      }
      for (let y = 0; y <= grid.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(grid.width, y);
        ctx.stroke();
      }
    } else if (gridMode === "dots") {
      for (let x = 0; x <= grid.width; x += step) {
        for (let y = 0; y <= grid.height; y += step) {
          ctx.beginPath();
          ctx.arc(x, y, 1.3, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
    } else if (gridMode === "axes") {
      // plano cartesiano con ejes centrados y marcas
      for (let x = 0; x <= grid.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, grid.height);
        ctx.stroke();
      }
      for (let y = 0; y <= grid.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(grid.width, y);
        ctx.stroke();
      }
      const cx = grid.width / 2;
      const cy = grid.height / 2;
      ctx.strokeStyle = "#9ca3af";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(grid.width, cy);
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, grid.height);
      ctx.stroke();
    }
  }

  function drawShapeOnCtx(
    ctx: CanvasRenderingContext2D,
    shapeType: ShapeTool,
    x1: number, y1: number, x2: number, y2: number,
    strokeColor: string, strokeWidth: number, fill: boolean
  ) {
    ctx.strokeStyle = strokeColor;
    ctx.fillStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    if (shapeType === "line") {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      return;
    }
    if (shapeType === "arrow") {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = Math.max(10, strokeWidth * 4);
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 7), y2 - headLen * Math.sin(angle - Math.PI / 7));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 7), y2 - headLen * Math.sin(angle + Math.PI / 7));
      ctx.closePath();
      ctx.fill();
      return;
    }
    if (shapeType === "rect") {
      ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    } else if (shapeType === "circle") {
      const radius = Math.hypot(x2 - x1, y2 - y1);
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    } else if (shapeType === "triangle") {
      const midX = (x1 + x2) / 2;
      ctx.moveTo(midX, y1);
      ctx.lineTo(x2, y2);
      ctx.lineTo(2 * x1 - x2, y2);
      ctx.closePath();
    }
    fill ? ctx.fill() : ctx.stroke();
  }

  function renderStroke(ctx: CanvasRenderingContext2D, op: StrokeOp) {
    if (op.points.length === 0) return;
    ctx.save();
    if (op.tool === "eraser") {
      ctx.globalCompositeOperation = "destination-out";
      ctx.strokeStyle = "rgba(0,0,0,1)";
    } else if (op.tool === "highlighter") {
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = op.color;
    } else {
      ctx.strokeStyle = op.color;
    }
    ctx.lineWidth = op.width;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    const p0 = relativeToAbsolute(op.points[0].x, op.points[0].y);
    ctx.moveTo(p0.absX, p0.absY);
    for (let i = 1; i < op.points.length; i++) {
      const p = relativeToAbsolute(op.points[i].x, op.points[i].y);
      ctx.lineTo(p.absX, p.absY);
    }
    ctx.stroke();
    ctx.restore();
  }

  function renderOp(ctx: CanvasRenderingContext2D, op: Op) {
    if (op.kind === "stroke") {
      renderStroke(ctx, op);
    } else if (op.kind === "shape") {
      const p1 = relativeToAbsolute(op.x1, op.y1);
      const p2 = relativeToAbsolute(op.x2, op.y2);
      drawShapeOnCtx(ctx, op.shapeType, p1.absX, p1.absY, p2.absX, p2.absY, op.color, op.width, op.fill);
    }
    // los ítems de texto/fórmula se renderizan aparte como overlay React
  }

  const redrawPage = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx(canvasRef);
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const page = pagesRef.current.find((p) => p.id === currentPageIdRef.current);
    if (!page) return;
    for (const op of page.ops) renderOp(ctx, op);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Manejo de ops (estado local) ---------- */

  function mutatePage(pageId: string, fn: (ops: Op[]) => Op[]) {
    setPages((prev) => prev.map((p) => (p.id === pageId ? { ...p, ops: fn(p.ops) } : p)));
  }

  function commitOp(pageId: string, op: Op, opts?: { fromRemote?: boolean; alreadyDrawnLive?: boolean }) {
    mutatePage(pageId, (ops) => [...ops, op]);
    if (pageId === currentPageIdRef.current && !opts?.alreadyDrawnLive) {
      const ctx = getCtx(canvasRef);
      if (ctx) renderOp(ctx, op);
    }
    if (!opts?.fromRemote) {
      redoStackRef.current[pageId] = [];
      sendWS({ type: "op-commit", pageId, op });
    }
  }

  function removeOp(pageId: string, opId: string, opts?: { fromRemote?: boolean }) {
    mutatePage(pageId, (ops) => ops.filter((o) => o.id !== opId));
    if (pageId === currentPageIdRef.current) {
      // redraw diferido: el estado se actualiza async, forzamos redibujo tras el próximo render
      queueMicrotask(redrawPage);
    }
    if (!opts?.fromRemote) sendWS({ type: "op-remove", pageId, opId });
  }

  function updateItemOp(pageId: string, opId: string, patch: Partial<ItemOp>, opts?: { fromRemote?: boolean }) {
    mutatePage(pageId, (ops) => ops.map((o) => (o.id === opId && o.kind === "item" ? { ...o, ...patch } : o)));
    if (!opts?.fromRemote) sendWS({ type: "op-update", pageId, opId, patch });
  }

  /* ---------- WebSocket ---------- */

  function sendWS(msg: WSMessage) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }

  const connectWS = useCallback(() => {
    if (unmountedRef.current) return;
    // Si ya hay un socket abierto o abriéndose para esta instancia, no dupliques la conexión.
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }
    const wsUrl = `${import.meta.env.VITE_WS_URL}/api/whiteboard/ws/${roomCode}?role=${role}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (wsRef.current !== ws) return; // este socket ya fue reemplazado/descartado
      setConnected(true);
      reconnectAttemptsRef.current = 0;
      if (role === "viewer") sendWS({ type: "request-sync" });
    };

    ws.onclose = () => {
      if (wsRef.current !== ws) return; // cierre de un socket viejo ya reemplazado: ignorar
      setConnected(false);
      if (unmountedRef.current) return;
      const attempt = ++reconnectAttemptsRef.current;
      const delay = Math.min(1000 * 2 ** attempt, 15000);
      reconnectTimerRef.current = setTimeout(connectWS, delay);
    };

    ws.onerror = () => {
      if (wsRef.current === ws) ws.close();
    };

    ws.onmessage = (event) => {
      if (wsRef.current !== ws) return;
      try {
        handleRemoteMessage(JSON.parse(event.data));
      } catch {
        /* ignorar mensajes malformados */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, role]);

  useEffect(() => {
    unmountedRef.current = false;
    resizeCanvases();
    connectWS();

    const ro = new ResizeObserver(resizeCanvases);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      unmountedRef.current = true;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      ro.disconnect();
      const ws = wsRef.current;
      wsRef.current = null; // invalida el socket ANTES de cerrarlo, así su propio onclose no reconecta
      ws?.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, role]);

  useEffect(() => {
    drawGrid();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridMode]);

  useEffect(() => {
    redrawPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPageId]);

  function handleRemoteMessage(msg: WSMessage) {
    switch (msg.type) {
      case "live-start": {
        if (msg.pageId !== currentPageIdRef.current) return;
        const ctx = getCtx(canvasRef);
        if (!ctx) return;
        const { absX, absY } = relativeToAbsolute(msg.x, msg.y);
        ctx.save();
        if (msg.tool === "eraser") ctx.globalCompositeOperation = "destination-out";
        else if (msg.tool === "highlighter") { ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.45; }
        ctx.beginPath();
        ctx.moveTo(absX, absY);
        ctx.strokeStyle = msg.color;
        ctx.lineWidth = msg.width;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        return;
      }
      case "live-point": {
        if (msg.pageId !== currentPageIdRef.current) return;
        const ctx = getCtx(canvasRef);
        if (!ctx) return;
        const { absX, absY } = relativeToAbsolute(msg.x, msg.y);
        ctx.lineTo(absX, absY);
        ctx.stroke();
        return;
      }
      case "live-end": {
        const ctx = getCtx(canvasRef);
        ctx?.restore();
        return;
      }
      case "op-commit":
        commitOp(msg.pageId, msg.op, { fromRemote: true, alreadyDrawnLive: msg.op.kind === "stroke" });
        return;
      case "op-remove":
        removeOp(msg.pageId, msg.opId, { fromRemote: true });
        return;
      case "op-update":
        updateItemOp(msg.pageId, msg.opId, msg.patch, { fromRemote: true });
        return;
      case "clear":
        mutatePage(msg.pageId, () => []);
        if (msg.pageId === currentPageIdRef.current) queueMicrotask(redrawPage);
        return;
      case "page-add":
        setPages((prev) => (prev.some((p) => p.id === msg.pageId) ? prev : [...prev, { id: msg.pageId, ops: [] }]));
        return;
      case "page-remove":
        setPages((prev) => (prev.length > 1 ? prev.filter((p) => p.id !== msg.pageId) : prev));
        return;
      case "page-switch":
        setCurrentPageId(msg.pageId);
        return;
      case "request-sync":
        if (isHost) {
          sendWS({ type: "full-sync", pages: pagesRef.current, currentPageId: currentPageIdRef.current });
        }
        return;
      case "full-sync":
        setPages(msg.pages);
        setCurrentPageId(msg.currentPageId);
        return;
    }
  }

  /* ---------- Interacción con puntero ---------- */

  function getRelativePos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? (e.touches[0] ?? e.changedTouches[0]).clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? (e.touches[0] ?? e.changedTouches[0]).clientY : (e as React.MouseEvent).clientY;
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  }

  function openItemModal(kind: "text" | "formula", x: number, y: number) {
    setFormulaModal({ open: true, kind, x, y, value: "" });
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (!isHost) return;
    const { x, y } = getRelativePos(e);

    if (tool === "text" || tool === "formula") {
      openItemModal(tool, x, y);
      return;
    }

    if (tool === "select") {
      return; // el drag de ítems se maneja en sus propios handlers
    }

    if (isShapeTool(tool)) {
      dragStartRef.current = { x, y };
      lastMoveRef.current = { x, y };
      return;
    }

    // pen / highlighter / eraser
    isDrawingRef.current = true;
    const id = genId();
    const effectiveColor = color;
    const effectiveWidth = tool === "eraser" ? brushWidth * 5 : tool === "highlighter" ? brushWidth * 3 : brushWidth;
    currentStrokeRef.current = { kind: "stroke", id, tool: tool as DrawTool, points: [{ x, y }], color: effectiveColor, width: effectiveWidth };

    const ctx = getCtx(canvasRef);
    if (ctx) {
      const { absX, absY } = relativeToAbsolute(x, y);
      ctx.save();
      if (tool === "eraser") ctx.globalCompositeOperation = "destination-out";
      else if (tool === "highlighter") { ctx.globalCompositeOperation = "multiply"; ctx.globalAlpha = 0.45; }
      ctx.beginPath();
      ctx.moveTo(absX, absY);
      ctx.strokeStyle = effectiveColor;
      ctx.lineWidth = effectiveWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    sendWS({ type: "live-start", pageId: currentPageId, strokeId: id, x, y, color: effectiveColor, width: effectiveWidth, tool: tool as DrawTool });
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (!isHost) return;
    const { x, y } = getRelativePos(e);
    lastMoveRef.current = { x, y };

    if (isShapeTool(tool) && dragStartRef.current) {
      const previewCtx = getCtx(previewCanvasRef);
      const preview = previewCanvasRef.current;
      if (previewCtx && preview) {
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        const p1 = relativeToAbsolute(dragStartRef.current.x, dragStartRef.current.y);
        const p2 = relativeToAbsolute(x, y);
        drawShapeOnCtx(previewCtx, tool, p1.absX, p1.absY, p2.absX, p2.absY, color, brushWidth, fillShape);
      }
      return;
    }

    if (!isDrawingRef.current || !currentStrokeRef.current) return;
    currentStrokeRef.current.points.push({ x, y });
    const ctx = getCtx(canvasRef);
    if (ctx) {
      const { absX, absY } = relativeToAbsolute(x, y);
      ctx.lineTo(absX, absY);
      ctx.stroke();
    }
    sendWS({ type: "live-point", pageId: currentPageId, strokeId: currentStrokeRef.current.id, x, y });
  }

  function handleEnd(_e: React.MouseEvent | React.TouchEvent) {
    if (!isHost) return;

    if (isShapeTool(tool) && dragStartRef.current) {
      const { x, y } = lastMoveRef.current ?? dragStartRef.current;
      const previewCtx = getCtx(previewCanvasRef);
      const preview = previewCanvasRef.current;
      if (previewCtx && preview) previewCtx.clearRect(0, 0, preview.width, preview.height);

      const op: ShapeOp = {
        kind: "shape", id: genId(), shapeType: tool,
        x1: dragStartRef.current.x, y1: dragStartRef.current.y, x2: x, y2: y,
        color, width: brushWidth, fill: fillShape,
      };
      commitOp(currentPageId, op);
      dragStartRef.current = null;
      return;
    }

    if (isDrawingRef.current && currentStrokeRef.current) {
      const ctx = getCtx(canvasRef);
      ctx?.restore();
      commitOp(currentPageId, currentStrokeRef.current, { alreadyDrawnLive: true });
      sendWS({ type: "live-end", pageId: currentPageId, strokeId: currentStrokeRef.current.id });
      currentStrokeRef.current = null;
    }
    isDrawingRef.current = false;
  }

  /* ---------- Acciones de la barra de herramientas ---------- */

  function handleClear() {
    mutatePage(currentPageId, () => []);
    redoStackRef.current[currentPageId] = [];
    const ctx = getCtx(canvasRef);
    const canvas = canvasRef.current;
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    sendWS({ type: "clear", pageId: currentPageId });
  }

  function handleUndo() {
    const ops = pagesRef.current.find((p) => p.id === currentPageId)?.ops ?? [];
    const last = ops[ops.length - 1];
    if (!last) return;
    redoStackRef.current[currentPageId] = [...(redoStackRef.current[currentPageId] ?? []), last];
    removeOp(currentPageId, last.id);
  }

  function handleRedo() {
    const stack = redoStackRef.current[currentPageId] ?? [];
    const op = stack[stack.length - 1];
    if (!op) return;
    redoStackRef.current[currentPageId] = stack.slice(0, -1);
    commitOp(currentPageId, op);
  }

  function addPage() {
    const id = genId();
    setPages((prev) => [...prev, { id, ops: [] }]);
    setCurrentPageId(id);
    sendWS({ type: "page-add", pageId: id });
    sendWS({ type: "page-switch", pageId: id });
  }

  function removePage(id: string) {
    if (pages.length <= 1) return;
    const idx = pages.findIndex((p) => p.id === id);
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (currentPageId === id) {
      const next = pages[idx - 1] ?? pages[idx + 1];
      if (next) {
        setCurrentPageId(next.id);
        sendWS({ type: "page-switch", pageId: next.id });
      }
    }
    sendWS({ type: "page-remove", pageId: id });
  }

  function switchPage(id: string) {
    setCurrentPageId(id);
    sendWS({ type: "page-switch", pageId: id });
  }

  function confirmItemModal() {
    const { kind, x, y, value } = formulaModal;
    if (!value.trim()) {
      setFormulaModal((m) => ({ ...m, open: false }));
      return;
    }
    const op: ItemOp = { kind: "item", id: genId(), itemType: kind, x, y, content: value };
    commitOp(currentPageId, op);
    setFormulaModal((m) => ({ ...m, open: false, value: "" }));
  }

  function insertSnippet(snippet: string) {
    setFormulaModal((m) => ({ ...m, value: m.value + snippet }));
  }

  function exportPNG() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const merged = document.createElement("canvas");
    merged.width = canvas.width;
    merged.height = canvas.height;
    const mctx = merged.getContext("2d")!;
    mctx.fillStyle = "#ffffff";
    mctx.fillRect(0, 0, merged.width, merged.height);
    mctx.drawImage(canvas, 0, 0);
    const link = document.createElement("a");
    link.download = `pizarra-${roomCode}-${Date.now()}.png`;
    link.href = merged.toDataURL("image/png");
    link.click();
  }

  /* ---------- Selección / arrastre de ítems (texto y fórmulas) ---------- */

  function handleItemPointerDown(e: React.MouseEvent, item: ItemOp) {
    if (!isHost || tool !== "select") return;
    e.stopPropagation();
    setSelectedItemId(item.id);
    const rect = containerRef.current!.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    draggingItemRef.current = { id: item.id, offsetX: px - item.x, offsetY: py - item.y };

    function onMove(ev: MouseEvent) {
      if (!draggingItemRef.current) return;
      const r = containerRef.current!.getBoundingClientRect();
      const nx = (ev.clientX - r.left) / r.width - draggingItemRef.current.offsetX;
      const ny = (ev.clientY - r.top) / r.height - draggingItemRef.current.offsetY;
      updateItemOp(currentPageId, draggingItemRef.current.id, { x: nx, y: ny });
    }
    function onUp() {
      draggingItemRef.current = null;
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  function deleteSelectedItem() {
    if (!selectedItemId) return;
    removeOp(currentPageId, selectedItemId);
    setSelectedItemId(null);
  }

  /* ---------- Atajos de teclado ---------- */

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!isHost) return;
      const meta = e.ctrlKey || e.metaKey;
      if (meta && e.key.toLowerCase() === "z" && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      else if (meta && (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey))) { e.preventDefault(); handleRedo(); }
      else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedItemId && document.activeElement?.tagName !== "TEXTAREA" && document.activeElement?.tagName !== "INPUT") {
          deleteSelectedItem();
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, selectedItemId, currentPageId]);

  /* ---------- Render ---------- */

  const items = currentOps.filter((o): o is ItemOp => o.kind === "item");

  const toolButtons: { tool: Tool; label: string; title: string }[] = [
    { tool: "pen", label: "✏️", title: "Lápiz" },
    { tool: "highlighter", label: "🖍️", title: "Resaltador" },
    { tool: "eraser", label: "🧹", title: "Borrador" },
    { tool: "select", label: "🖱️", title: "Seleccionar / mover" },
    { tool: "line", label: "／", title: "Línea" },
    { tool: "arrow", label: "➚", title: "Flecha / vector" },
    { tool: "rect", label: "▭", title: "Rectángulo" },
    { tool: "circle", label: "○", title: "Círculo" },
    { tool: "triangle", label: "△", title: "Triángulo" },
    { tool: "text", label: "🔤", title: "Texto" },
    { tool: "formula", label: "∑", title: "Fórmula LaTeX" },
  ];

  return (
    <div>
      {/* ---------- Barra de herramientas ---------- */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: connected ? "#16a34a" : "#dc2626" }}>
          {connected ? "● Conectado" : "○ Reconectando..."}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Sala: <strong>{roomCode}</strong></span>

        {isHost && (
          <>
            <div style={{ display: "flex", gap: 4, border: "1px solid #e5e7eb", borderRadius: 8, padding: 4 }}>
              {toolButtons.map((tb) => (
                <button
                  key={tb.tool}
                  type="button"
                  title={tb.title}
                  onClick={() => setTool(tb.tool)}
                  style={{
                    background: tool === tb.tool ? "#4f46e5" : "#f3f4f6",
                    color: tool === tb.tool ? "#fff" : "#111827",
                    border: "none", borderRadius: 6, padding: "4px 8px", cursor: "pointer", fontSize: 15,
                  }}
                >
                  {tb.label}
                </button>
              ))}
            </div>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  title={c}
                  style={{
                    width: 20, height: 20, borderRadius: "50%", background: c,
                    border: color === c ? "2px solid #4f46e5" : "1px solid #d1d5db", cursor: "pointer",
                  }}
                />
              ))}
              <input type="color" value={color} onChange={(e) => setColor(e.target.value)} title="Color personalizado" />
            </div>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              {WIDTH_PRESETS.map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setBrushWidth(w)}
                  title={`Grosor ${w}`}
                  style={{
                    width: 26, height: 26, borderRadius: "50%", background: "#f3f4f6",
                    border: brushWidth === w ? "2px solid #4f46e5" : "1px solid #d1d5db", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >
                  <span style={{ width: w, height: w, borderRadius: "50%", background: color }} />
                </button>
              ))}
            </div>

            {isShapeTool(tool) && (
              <label style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                <input type="checkbox" checked={fillShape} onChange={(e) => setFillShape(e.target.checked)} />
                Relleno
              </label>
            )}

            <select value={gridMode} onChange={(e) => setGridMode(e.target.value as GridMode)} title="Fondo">
              <option value="none">Sin fondo</option>
              <option value="lines">Cuadrícula</option>
              <option value="dots">Puntos</option>
              <option value="axes">Plano cartesiano</option>
            </select>

            <button type="button" onClick={handleUndo} title="Deshacer (Ctrl+Z)">↶</button>
            <button type="button" onClick={handleRedo} title="Rehacer (Ctrl+Shift+Z)">↷</button>
            {selectedItemId && (
              <button type="button" onClick={deleteSelectedItem} title="Eliminar ítem seleccionado">🗑 Ítem</button>
            )}
            <button type="button" onClick={handleClear}>🗑 Limpiar página</button>
            <button type="button" onClick={exportPNG} title="Descargar como PNG">⬇ PNG</button>

            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <button type="button" onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))} title="Alejar">−</button>
              <span style={{ fontSize: 12, width: 36, textAlign: "center" }}>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom((z) => Math.min(2, z + 0.1))} title="Acercar">+</button>
              <button type="button" onClick={() => setZoom(1)} title="Restablecer zoom">⤾</button>
            </div>
          </>
        )}
      </div>

      {/* ---------- Páginas ---------- */}
      {isHost && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
          {pages.map((p, i) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => switchPage(p.id)}
                style={{
                  background: currentPageId === p.id ? "#4f46e5" : "#f3f4f6",
                  color: currentPageId === p.id ? "#fff" : "#111827",
                  border: "none", borderRadius: "6px 0 0 6px", padding: "4px 10px", cursor: "pointer", fontSize: 13,
                }}
              >
                Página {i + 1}
              </button>
              {pages.length > 1 && (
                <button
                  type="button"
                  onClick={() => removePage(p.id)}
                  title="Eliminar página"
                  style={{ border: "none", borderRadius: "0 6px 6px 0", padding: "4px 6px", background: "#fee2e2", cursor: "pointer" }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addPage} style={{ borderRadius: 6, padding: "4px 10px" }}>+ Página</button>
        </div>
      )}

      {/* ---------- Lienzo ---------- */}
      <div ref={containerRef} style={{ position: "relative", width: "100%", height: 520, overflow: "auto", border: "1px solid #d1d5db", borderRadius: 8 }}>
        <div style={{ position: "relative", width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
          <canvas ref={gridCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", background: "white" }} />
          <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />
          <canvas ref={previewCanvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} />

          <div
            style={{
              position: "absolute", inset: 0, touchAction: "none",
              cursor: isHost ? (tool === "text" || tool === "formula" ? "text" : tool === "select" ? "default" : "crosshair") : "default",
            }}
            onMouseDown={handleStart}
            onMouseMove={handleMove}
            onMouseUp={handleEnd}
            onMouseLeave={handleEnd}
            onTouchStart={handleStart}
            onTouchMove={handleMove}
            onTouchEnd={handleEnd}
          >
            {items.map((item) => (
              <div
                key={item.id}
                onMouseDown={(e) => handleItemPointerDown(e, item)}
                style={{
                  position: "absolute",
                  left: `${item.x * 100}%`,
                  top: `${item.y * 100}%`,
                  transform: "translate(-2px, -50%)",
                  background: "rgba(255,255,255,0.85)",
                  padding: "2px 6px",
                  borderRadius: 4,
                  fontSize: 15,
                  whiteSpace: "nowrap",
                  outline: selectedItemId === item.id ? "2px solid #4f46e5" : "none",
                  cursor: tool === "select" ? "grab" : "default",
                }}
              >
                {item.itemType === "formula" ? <MathDisplay latex={item.content} /> : item.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Modal de texto / fórmula ---------- */}
      {formulaModal.open && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
          }}
          onClick={() => setFormulaModal((m) => ({ ...m, open: false }))}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: "white", borderRadius: 10, padding: 20, width: 460, maxWidth: "90vw" }}
          >
            <h3 style={{ marginTop: 0 }}>{formulaModal.kind === "formula" ? "Insertar fórmula (LaTeX)" : "Insertar texto"}</h3>

            <textarea
              autoFocus
              value={formulaModal.value}
              onChange={(e) => setFormulaModal((m) => ({ ...m, value: e.target.value }))}
              placeholder={formulaModal.kind === "formula" ? "Ej: x^{2} + \\frac{1}{2}" : "Escribí tu texto..."}
              rows={3}
              style={{ width: "100%", padding: 8, fontFamily: "monospace", fontSize: 14, boxSizing: "border-box" }}
            />

            {formulaModal.kind === "formula" && (
              <>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 8, maxHeight: 110, overflowY: "auto" }}>
                  {LATEX_SNIPPETS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => insertSnippet(s.insert)}
                      style={{ padding: "3px 8px", fontSize: 13, borderRadius: 6, border: "1px solid #d1d5db", background: "#f9fafb", cursor: "pointer" }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                {formulaModal.value.trim() && (
                  <div style={{ marginTop: 10, padding: 10, background: "#f9fafb", borderRadius: 6 }}>
                    <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 4 }}>Vista previa:</div>
                    <MathDisplay latex={formulaModal.value} />
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              <button type="button" onClick={() => setFormulaModal((m) => ({ ...m, open: false }))}>Cancelar</button>
              <button
                type="button"
                onClick={confirmItemModal}
                style={{ background: "#4f46e5", color: "white", border: "none", borderRadius: 6, padding: "6px 14px", cursor: "pointer" }}
              >
                Insertar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}