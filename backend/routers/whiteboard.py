import random
import string
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends

from dependencies import get_current_user
import models
from websocket_manager import whiteboard_manager

router = APIRouter(prefix="/api/whiteboard", tags=["whiteboard"])


def generate_room_code(length: int = 6) -> str:
    return "".join(random.choices(string.ascii_uppercase + string.digits, k=length))


@router.post("/create-room")
def create_room(user: models.User = Depends(get_current_user)):
    """
    Crea una sala nueva de pizarra y devuelve el código para compartir
    con los alumnos. Requiere estar logueado (cualquier usuario puede
    hostear por ahora, no hay restricción por rol todavía).
    """
    room_code = generate_room_code()
    while room_code in whiteboard_manager.rooms:
        room_code = generate_room_code()
    whiteboard_manager.get_or_create_room(room_code)
    return {"room_code": room_code}


@router.websocket("/ws/{room_code}")
async def whiteboard_socket(websocket: WebSocket, room_code: str, role: str = "viewer"):
    """
    Conexión en tiempo real a una sala. role="host" (el profesor, puede
    dibujar) o role="viewer" (el alumno, solo recibe lo que dibuja el host).
    Si alguien con role="viewer" intenta mandar un mensaje, se ignora:
    solo el host puede emitir acciones de dibujo.
    """
    room = whiteboard_manager.get_or_create_room(room_code)
    await room.connect(websocket, role)

    try:
        while True:
            data = await websocket.receive_json()
            if role == "host":
                await room.broadcast(data, sender=websocket)
    except WebSocketDisconnect:
        room.disconnect(websocket)
        whiteboard_manager.remove_room_if_empty(room_code)