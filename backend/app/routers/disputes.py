from fastapi import APIRouter, HTTPException
from typing import List, Optional
from app.models.dispute_schemas import ClinicDispute, SubmitJustificationRequest, ResolveDisputeRequest
from app.services.dispute_service import dispute_service

router = APIRouter(prefix="/api/v1/disputes", tags=["FSMS Clinic Disputes & Penalties"])

@router.get("", response_model=List[ClinicDispute])
def get_disputes():
    """Returns all active justification requests sent to clinics with countdown timers."""
    return dispute_service.get_all()

@router.post("/{dispute_id}/submit-justification")
def submit_justification(dispute_id: str, body: SubmitJustificationRequest):
    """Medical clinic submits written justification and diagnostic files to FSMS/DER."""
    res = dispute_service.submit_justification(dispute_id, body.justification_text, body.file_attachments)
    if not res:
        raise HTTPException(status_code=404, detail="Dispute record not found")
    return res

@router.post("/{dispute_id}/resolve")
def resolve_dispute(dispute_id: str, body: ResolveDisputeRequest):
    """FSMS Auditor approves justification (money transfer authorized) or rejects (penalty sanctions applied)."""
    res = dispute_service.resolve_dispute(dispute_id, body.action, body.auditor_comment or "")
    if not res:
        raise HTTPException(status_code=404, detail="Dispute record not found")
    return res
