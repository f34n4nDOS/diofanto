from typing import Dict, List, Tuple
from fastapi import WebSocket


class WhiteboardRoom:
    def __init__(self):
        self.connections: List[Tuple[WebSocket, str]] = []  # (websocket, role)

    async def connect(self, websocket: WebSocket, role: str):
        await websocket.accept()
        self.connections.append((websocket, role))

    def disconnect(self, websocket: WebSocket):
        self.connections = [(ws, r) for ws, r in self.connections if ws != websocket]

    async def broadcast(self, message: dict, sender: WebSocket):
        for ws, _role in self.connections:
            if ws is not sender:
                try:
                    await ws.send_json(message)
                except Exception:
                    pass  # la conexión puede haberse caído justo en este instante

    async def broadcast_all(self, message: dict):
        """Como broadcast, pero a TODAS las conexiones (incluido quien
        dispara el evento) — usado para avisos del servidor, como el
        conteo de conectados, que no vienen de ningún cliente puntual."""
        for ws, _role in self.connections:
            try:
                await ws.send_json(message)
            except Exception:
                pass

    @property
    def is_empty(self) -> bool:
        return len(self.connections) == 0

    @property
    def viewer_count(self) -> int:
        return sum(1 for _, role in self.connections if role == "viewer")


class WhiteboardManager:
    def __init__(self):
        self.rooms: Dict[str, WhiteboardRoom] = {}

    def get_or_create_room(self, room_code: str) -> WhiteboardRoom:
        if room_code not in self.rooms:
            self.rooms[room_code] = WhiteboardRoom()
        return self.rooms[room_code]

    def remove_room_if_empty(self, room_code: str):
        room = self.rooms.get(room_code)
        if room and room.is_empty:
            del self.rooms[room_code]


whiteboard_manager = WhiteboardManager()