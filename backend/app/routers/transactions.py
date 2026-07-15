from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from app.models.schemas import TransactionPayload, TransactionResult
from app.database.db import db
from app.services.fraud_detector import FraudDetector

router = APIRouter(prefix="/api/transactions", tags=["Transactions"])

@router.post("/check", response_model=TransactionResult)
def check_transaction(payload: TransactionPayload):
    try:
        result = FraudDetector.check_transaction(payload)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("", response_model=dict)
def get_transactions(
    status: str = Query("ALL", description="Filter by status: APPROVED, SUSPICION, BLOCKED, or ALL"),
    search: Optional[str] = Query(None, description="Search by Patient/Doctor IIN or Clinic Name"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100)
):
    filtered = db.transactions
    
    # Filter by status
    if status != "ALL":
        filtered = [tx for tx in filtered if tx.status == status]
        
    # Search
    if search:
        search_lower = search.lower()
        filtered = [
            tx for tx in filtered
            if search_lower in tx.payload.patient_iin or
               search_lower in tx.payload.doctor_iin or
               (tx.patient and search_lower in tx.patient.name.lower()) or
               (tx.doctor and search_lower in tx.doctor.name.lower()) or
               (tx.clinic and search_lower in tx.clinic.name.lower())
        ]
        
    # Sort by timestamp descending
    filtered = sorted(filtered, key=lambda x: x.payload.timestamp, reverse=True)
    
    # Pagination
    total = len(filtered)
    start = (page - 1) * page_size
    end = start + page_size
    items = filtered[start:end]
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size if total > 0 else 1
    }
