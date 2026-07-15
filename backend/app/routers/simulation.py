from fastapi import APIRouter, Query, HTTPException
from app.database.db import db
from app.services.generator import LogGenerator

router = APIRouter(prefix="/api/simulation", tags=["Simulation"])

@router.post("/generate")
def generate_simulation(count: int = Query(100, ge=1, le=1000)):
    try:
        results = LogGenerator.generate_batch(count)
        return {
            "success": True,
            "generated_count": len(results),
            "message": f"Сгенерировано {len(results)} транзакций с 15% содержанием фрода."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/reset")
def reset_simulation():
    try:
        db.clear_all()
        # Automatically generate an initial batch of 150 records to fill the dashboard on reset
        LogGenerator.generate_batch(150)
        return {
            "success": True,
            "message": "База данных успешно сброшена и инициализирована 150 тестовыми записями (15% фрод)."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
