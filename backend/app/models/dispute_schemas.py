from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ClinicDispute(BaseModel):
    id: str
    claim_id: str
    clinic_id: str
    clinic_name: str
    clinic_email: str
    service_code: str
    service_name: str
    amount_kzt: float
    rejection_reason: str
    ml_risk_score: float  # 0 to 100%
    created_at: datetime
    deadline_at: datetime  # 72 hours countdown
    status: str  # "PENDING_JUSTIFICATION", "JUSTIFICATION_SUBMITTED", "APPROVED_PAID", "REJECTED_SANCTIONED"
    justification_text: Optional[str] = None
    justification_files: List[str] = []
    submitted_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    penalty_amount_kzt: float = 0.0

class SubmitJustificationRequest(BaseModel):
    justification_text: str
    file_attachments: Optional[List[str]] = []

class ResolveDisputeRequest(BaseModel):
    action: str  # "APPROVE" or "REJECT"
    auditor_comment: Optional[str] = None
