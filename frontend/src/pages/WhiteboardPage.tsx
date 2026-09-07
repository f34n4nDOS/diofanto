import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import WhiteboardCanvas from "../components/WhiteboardCanvas";

export default function WhiteboardPage() {
  const [mode, setMode] = useState<"menu" | "host" | "viewer">("menu");
  const [roomCode, setRoomCode] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCreateRoom() {
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/api/whiteboard/create-room");
      setRoomCode(res.data.room_code);
      setMode("host");
    } catch {
      setError("No se pudo crear la sala. Confirmá que estás logueado.");
    } finally {
      setLoading(false);
    }
  }

  function handleJoin() {
    if (!joinCode.trim()) return;
    setRoomCode(joinCode.trim().toUpperCase());
    setMode("viewer");
  }

  if (mode === "menu") {
    return (
      <div style={{ maxWidth: 500, margin: "60px auto", padding: "0 16px" }}>
        <Link to="/dashboard">&larr; Volver al dashboard</Link>
        <h1>🖊️ Pizarra en vivo</h1>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16, marginBottom: 16 }}>
          <h3>Soy profesor</h3>
          <p>Creá una sala nueva y compartí el código con tus alumnos.</p>
          <button onClick={handleCreateRoom} disabled={loading}>
            {loading ? "Creando..." : "Crear pizarra"}
          </button>
        </div>

        <div style={{ border: "1px solid #d1d5db", borderRadius: 8, padding: 16 }}>
          <h3>Soy alumno</h3>
          <p>Ingresá el código que te compartió tu profesor.</p>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Ej: A3F9K2"
              style={{ flex: 1, padding: 8, textTransform: "uppercase" }}
            />
            <button onClick={handleJoin}>Unirme</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 16px" }}>
      <Link to="/dashboard">&larr; Volver al dashboard</Link>
      <h1>🖊️ Pizarra {mode === "host" ? "(profesor)" : "(alumno)"}</h1>
      {mode === "host" && (
        <p>Compartí este código con tus alumnos: <strong style={{ fontSize: 20 }}>{roomCode}</strong></p>
      )}
      <WhiteboardCanvas roomCode={roomCode} role={mode} />
    </div>
  );
}