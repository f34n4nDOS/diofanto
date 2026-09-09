import { useEffect, useRef, useState } from "react";
import MathDisplay from "./MathDisplay";

interface WhiteboardCanvasProps {
  roomCode: string;
  role: "host" | "viewer";
}

type Tool = "pen" | "eraser" | "line" | "rect" | "circle" | "text" | "formula";

interface WhiteboardEvent {
  type: "start" | "point" | "end" | "clear" | "shape" | "text" | "formula";
  strokeId?: string;
  x?: number;
  y?: number;
  x2?: number;
  y2?: number;
  color?: string;
  width?: number;
  shapeType?: "line" | "rect" | "circle";
  itemId?: string;
  content?: string;
}

interface PlacedItem {
  id: string;
  type: "text" | "formula";
  x: number; // relativo 0-1
  y: number;
  content: string;
}

export default function WhiteboardCanvas({ roomCode, role }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef<string>("");
  const dragStartRef = useRef<{ x: number; y: number } | null>(null);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState("#1e2340");
  const [brushWidth, setBrushWidth] = useState(3);
  const [connected, setConnected] = useState(false);
  const [placedItems, setPlacedItems] = useState<PlacedItem[]>([]);

  const isEraser = tool === "eraser";
  const isShapeTool = tool === "line" || tool === "rect" || tool === "circle";

  useEffect(() => {
    const canvas = canvasRef.current;
    const preview = previewCanvasRef.current;
    if (!canvas || !preview) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;
    preview.width = preview.clientWidth;
    preview.height = preview.clientHeight;

    const wsUrl = `${import.meta.env.VITE_WS_URL}/api/whiteboard/ws/${roomCode}?role=${role}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => handleRemoteEvent(JSON.parse(event.data));

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, role]);

  function getCtx(ref: React.RefObject<HTMLCanvasElement>) {
    return ref.current?.getContext("2d") ?? null;
  }

  function relativeToAbsolute(x: number, y: number) {
    const canvas = canvasRef.current!;
    return { absX: x * canvas.width, absY: y * canvas.height };
  }

  function drawShapeOnCtx(
    ctx: CanvasRenderingContext2D,
    shapeType: "line" | "rect" | "circle",
    x1: number, y1: number, x2: number, y2: number,
    strokeColor: string, strokeWidth: number
  ) {
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    if (shapeType === "line") {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    } else if (shapeType === "rect") {
      ctx.rect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));
    } else if (shapeType === "circle") {
      const radius = Math.hypot(x2 - x1, y2 - y1);
      ctx.arc(x1, y1, radius, 0, 2 * Math.PI);
    }
    ctx.stroke();
  }

  function handleRemoteEvent(data: WhiteboardEvent) {
    const ctx = getCtx(canvasRef);
    if (!ctx || !canvasRef.current) return;

    if (data.type === "clear") {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setPlacedItems([]);
      return;
    }

    if (data.type === "start" && data.x !== undefined && data.y !== undefined) {
      const { absX, absY } = relativeToAbsolute(data.x, data.y);
      ctx.beginPath();
      ctx.moveTo(absX, absY);
      ctx.strokeStyle = data.color ?? "#000";
      ctx.lineWidth = data.width ?? 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      return;
    }

    if (data.type === "point" && data.x !== undefined && data.y !== undefined) {
      const { absX, absY } = relativeToAbsolute(data.x, data.y);
      ctx.lineTo(absX, absY);
      ctx.stroke();
      return;
    }

    if (data.type === "shape" && data.x !== undefined && data.y !== undefined && data.x2 !== undefined && data.y2 !== undefined && data.shapeType) {
      const p1 = relativeToAbsolute(data.x, data.y);
      const p2 = relativeToAbsolute(data.x2, data.y2);
      drawShapeOnCtx(ctx, data.shapeType, p1.absX, p1.absY, p2.absX, p2.absY, data.color ?? "#000", data.width ?? 3);
      return;
    }

    if ((data.type === "text" || data.type === "formula") && data.x !== undefined && data.y !== undefined && data.content !== undefined) {
      setPlacedItems((prev) => [...prev, { id: data.itemId ?? Math.random().toString(36).slice(2), type: data.type as "text" | "formula", x: data.x!, y: data.y!, content: data.content! }]);
    }
  }

  function sendEvent(event: WhiteboardEvent) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }

  function getRelativePos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: (clientX - rect.left) / rect.width, y: (clientY - rect.top) / rect.height };
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (role !== "host") return;
    const { x, y } = getRelativePos(e);

    if (tool === "text" || tool === "formula") {
      const promptLabel = tool === "text" ? "Texto a escribir:" : "Fórmula en LaTeX (ej: x^2 + 1):";
      const content = window.prompt(promptLabel);
      if (!content) return;
      const itemId = Math.random().toString(36).slice(2);
      setPlacedItems((prev) => [...prev, { id: itemId, type: tool, x, y, content }]);
      sendEvent({ type: tool, itemId, x, y, content });
      return;
    }

    if (isShapeTool) {
      dragStartRef.current = { x, y };
      return;
    }

    // pen / eraser
    isDrawingRef.current = true;
    currentStrokeIdRef.current = Math.random().toString(36).slice(2);
    const effectiveColor = isEraser ? "#ffffff" : color;
    const effectiveWidth = isEraser ? brushWidth * 4 : brushWidth;

    const ctx = getCtx(canvasRef);
    if (ctx) {
      const { absX, absY } = relativeToAbsolute(x, y);
      ctx.beginPath();
      ctx.moveTo(absX, absY);
      ctx.strokeStyle = effectiveColor;
      ctx.lineWidth = effectiveWidth;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
    sendEvent({ type: "start", strokeId: currentStrokeIdRef.current, x, y, color: effectiveColor, width: effectiveWidth });
  }

  function handleMove(e: React.MouseEvent | React.TouchEvent) {
    if (role !== "host") return;
    const { x, y } = getRelativePos(e);

    if (isShapeTool && dragStartRef.current) {
      const previewCtx = getCtx(previewCanvasRef);
      const preview = previewCanvasRef.current;
      if (previewCtx && preview) {
        previewCtx.clearRect(0, 0, preview.width, preview.height);
        const p1 = relativeToAbsolute(dragStartRef.current.x, dragStartRef.current.y);
        const p2 = relativeToAbsolute(x, y);
        drawShapeOnCtx(previewCtx, tool as "line" | "rect" | "circle", p1.absX, p1.absY, p2.absX, p2.absY, color, brushWidth);
      }
      return;
    }

    if (!isDrawingRef.current) return;
    const ctx = getCtx(canvasRef);
    if (ctx) {
      const { absX, absY } = relativeToAbsolute(x, y);
      ctx.lineTo(absX, absY);
      ctx.stroke();
    }
    sendEvent({ type: "point", strokeId: currentStrokeIdRef.current, x, y });
  }

  function handleEnd(e: React.MouseEvent | React.TouchEvent) {
    if (role !== "host") return;

    if (isShapeTool && dragStartRef.current) {
      const { x, y } = "changedTouches" in e
        ? { x: dragStartRef.current.x, y: dragStartRef.current.y } // fallback simple para touch-end
        : getRelativePos(e as React.MouseEvent);

      const previewCtx = getCtx(previewCanvasRef);
      const preview = previewCanvasRef.current;
      if (previewCtx && preview) previewCtx.clearRect(0, 0, preview.width, preview.height);

      const ctx = getCtx(canvasRef);
      if (ctx) {
        const p1 = relativeToAbsolute(dragStartRef.current.x, dragStartRef.current.y);
        const p2 = relativeToAbsolute(x, y);
        drawShapeOnCtx(ctx, tool as "line" | "rect" | "circle", p1.absX, p1.absY, p2.absX, p2.absY, color, brushWidth);
      }

      sendEvent({
        type: "shape", shapeType: tool as "line" | "rect" | "circle",
        x: dragStartRef.current.x, y: dragStartRef.current.y, x2: x, y2: y,
        color, width: brushWidth,
      });
      dragStartRef.current = null;
      return;
    }

    isDrawingRef.current = false;
    sendEvent({ type: "end", strokeId: currentStrokeIdRef.current });
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = getCtx(canvasRef);
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setPlacedItems([]);
    sendEvent({ type: "clear" });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: connected ? "#16a34a" : "#dc2626" }}>
          {connected ? "● Conectado" : "○ Desconectado"}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Sala: <strong>{roomCode}</strong></span>

        {role === "host" && (
          <>
            <button type="button" onClick={() => setTool("pen")} style={{ background: tool === "pen" ? "#4f46e5" : undefined }}>✏️ Lápiz</button>
            <button type="button" onClick={() => setTool("eraser")} style={{ background: tool === "eraser" ? "#f59e0b" : undefined }}>🧹 Borrador</button>
            <button type="button" onClick={() => setTool("line")} style={{ background: tool === "line" ? "#4f46e5" : undefined }}>／ Línea</button>
            <button type="button" onClick={() => setTool("rect")} style={{ background: tool === "rect" ? "#4f46e5" : undefined }}>▭ Rectángulo</button>
            <button type="button" onClick={() => setTool("circle")} style={{ background: tool === "circle" ? "#4f46e5" : undefined }}>○ Círculo</button>
            <button type="button" onClick={() => setTool("text")} style={{ background: tool === "text" ? "#4f46e5" : undefined }}>🔤 Texto</button>
            <button type="button" onClick={() => setTool("formula")} style={{ background: tool === "formula" ? "#4f46e5" : undefined }}>∑ Fórmula</button>
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} />
            <input type="range" min={1} max={15} value={brushWidth} onChange={(e) => setBrushWidth(Number(e.target.value))} />
            <button type="button" onClick={handleClear}>🗑 Limpiar pizarra</button>
          </>
        )}
      </div>

      <div style={{ position: "relative", width: "100%", height: 500 }}>
        <canvas
          ref={canvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "1px solid #d1d5db", borderRadius: 8, background: "white" }}
        />
        <canvas
          ref={previewCanvasRef}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
        />
        <div
          style={{ position: "absolute", inset: 0, touchAction: "none", cursor: role === "host" ? (tool === "text" || tool === "formula" ? "text" : "crosshair") : "default" }}
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          {placedItems.map((item) => (
            <div key={item.id} style={{ position: "absolute", left: `${item.x * 100}%`, top: `${item.y * 100}%`, transform: "translate(-2px, -50%)", background: "rgba(255,255,255,0.85)", padding: "2px 6px", borderRadius: 4, fontSize: 15, whiteSpace: "nowrap" }}>
              {item.type === "formula" ? <MathDisplay latex={item.content} /> : item.content}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}