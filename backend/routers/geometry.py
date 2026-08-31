from fastapi import APIRouter, HTTPException

from math_utils import solve_triangle_sss, circle_calculations, regular_polygon_calculations
import schemas

router = APIRouter(prefix="/api/geometry", tags=["geometry"])


@router.post("/triangle", response_model=schemas.TriangleResponse)
def triangle(req: schemas.TriangleRequest):
    try:
        result = solve_triangle_sss(req.side_a, req.side_b, req.side_c)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"No se pudo resolver el triángulo: {e}")

    if not result["valid"]:
        return schemas.TriangleResponse(valid=False)

    return schemas.TriangleResponse(**result)


@router.post("/circle", response_model=schemas.CircleResponse)
def circle(req: schemas.CircleRequest):
    if req.radius <= 0:
        raise HTTPException(status_code=400, detail="El radio debe ser positivo")
    return schemas.CircleResponse(**circle_calculations(req.radius))


@router.post("/regular-polygon", response_model=schemas.RegularPolygonResponse)
def regular_polygon(req: schemas.RegularPolygonRequest):
    try:
        result = regular_polygon_calculations(req.num_sides, req.side_length)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return schemas.RegularPolygonResponse(**result)