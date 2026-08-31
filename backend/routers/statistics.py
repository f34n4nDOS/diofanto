from fastapi import APIRouter, HTTPException

from math_utils import descriptive_stats, simulate_coin_flips, simulate_dice_rolls
import schemas

router = APIRouter(prefix="/api/stats", tags=["statistics"])


@router.post("/descriptive", response_model=schemas.DescriptiveStatsResponse)
def descriptive(req: schemas.DescriptiveStatsRequest):
    try:
        result = descriptive_stats(req.data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return schemas.DescriptiveStatsResponse(**result)


@router.post("/simulate-coin", response_model=schemas.CoinFlipResponse)
def simulate_coin(req: schemas.CoinFlipRequest):
    try:
        result = simulate_coin_flips(req.num_flips)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return schemas.CoinFlipResponse(**result)


@router.post("/simulate-dice", response_model=schemas.DiceRollResponse)
def simulate_dice(req: schemas.DiceRollRequest):
    try:
        result = simulate_dice_rolls(req.num_rolls, req.num_sides)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return schemas.DiceRollResponse(**result)