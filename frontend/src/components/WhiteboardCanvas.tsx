import { useEffect, useRef, useState } from "react";

interface WhiteboardCanvasProps {
  roomCode: string;
  role: "host" | "viewer";
}

interface StrokeEvent {
  type: "start" | "point" | "end" | "clear";
  strokeId?: string;
  x?: number;   // coordenadas relativas (0 a 1), para que funcione en pantallas de distinto tamaño
  y?: number;
  color?: string;
  width?: number;
}

export default function WhiteboardCanvas({ roomCode, role }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const isDrawingRef = useRef(false);
  const currentStrokeIdRef = useRef<string>("");
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const [color, setColor] = useState("#1e2340");
  const [brushWidth, setBrushWidth] = useState(3);
  const [isEraser, setIsEraser] = useState(false);
  const [connected, setConnected] = useState(false);
  const [viewerCount, setViewerCount] = useState<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const wsUrl = `${import.meta.env.VITE_WS_URL}/api/whiteboard/ws/${roomCode}?role=${role}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);

    ws.onmessage = (event) => {
      const data: StrokeEvent = JSON.parse(event.data);
      handleRemoteEvent(data);
    };

    return () => ws.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, role]);

  function getCtx() {
    return canvasRef.current?.getContext("2d") ?? null;
  }

  function relativeToAbsolute(x: number, y: number) {
    const canvas = canvasRef.current!;
    return { absX: x * canvas.width, absY: y * canvas.height };
  }

  function handleRemoteEvent(data: StrokeEvent) {
    const ctx = getCtx();
    if (!ctx || !canvasRef.current) return;

    if (data.type === "clear") {
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
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
    }

    if (data.type === "point" && data.x !== undefined && data.y !== undefined) {
      const { absX, absY } = relativeToAbsolute(data.x, data.y);
      ctx.lineTo(absX, absY);
      ctx.stroke();
    }
  }

  function sendEvent(event: StrokeEvent) {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }

  function getRelativePos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return {
      x: (clientX - rect.left) / rect.width,
      y: (clientY - rect.top) / rect.height,
    };
  }

  function handleStart(e: React.MouseEvent | React.TouchEvent) {
    if (role !== "host") return;
    const { x, y } = getRelativePos(e);
    isDrawingRef.current = true;
    currentStrokeIdRef.current = Math.random().toString(36).slice(2);
    lastPointRef.current = { x, y };

    const effectiveColor = isEraser ? "#ffffff" : color;
    const effectiveWidth = isEraser ? brushWidth * 4 : brushWidth;

    const ctx = getCtx();
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
    if (role !== "host" || !isDrawingRef.current) return;
    const { x, y } = getRelativePos(e);
    lastPointRef.current = { x, y };

    const ctx = getCtx();
    if (ctx) {
      const { absX, absY } = relativeToAbsolute(x, y);
      ctx.lineTo(absX, absY);
      ctx.stroke();
    }

    sendEvent({ type: "point", strokeId: currentStrokeIdRef.current, x, y });
  }

  function handleEnd() {
    if (role !== "host") return;
    isDrawingRef.current = false;
    sendEvent({ type: "end", strokeId: currentStrokeIdRef.current });
  }

  function handleClear() {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (ctx && canvas) ctx.clearRect(0, 0, canvas.width, canvas.height);
    sendEvent({ type: "clear" });
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: connected ? "#16a34a" : "#dc2626" }}>
          {connected ? "● Conectado" : "○ Desconectado"}
        </span>
        <span style={{ fontSize: 13, color: "#6b7280" }}>Sala: <strong>{roomCode}</strong></span>

        {role === "host" && (
          <>
            <input type="color" value={color} onChange={(e) => { setColor(e.target.value); setIsEraser(false); }} />
            <input
              type="range" min={1} max={15} value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
            />
            <button type="button" onClick={() => setIsEraser((v) => !v)} style={{ background: isEraser ? "#f59e0b" : undefined }}>
              {isEraser ? "🧹 Borrador activo" : "🧹 Borrador"}
            </button>
            <button type="button" onClick={handleClear}>🗑 Limpiar pizarra</button>
          </>
        )}
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: 500, border: "1px solid #d1d5db", borderRadius: 8, background: "white", touchAction: "none", cursor: role === "host" ? "crosshair" : "default" }}
        onMouseDown={handleStart}
        onMouseMove={handleMove}
        onMouseUp={handleEnd}
        onMouseLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchMove={handleMove}
        onTouchEnd={handleEnd}
      />
    </div>
  );
}