from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, date

class Patient(BaseModel):
    iin: str
    name: str
    gender: str  # "M" or "F"
    status: str  # "ACTIVE" or "DECEASED"
    death_date: Optional[str] = None
    birth_date: Optional[str] = None
    region: Optional[str] = None

class Doctor(BaseModel):
    iin: str
    name: str
    specialty: str
    is_on_leave: bool

class Clinic(BaseModel):
    id: str
    name: str
    region: str  # "Семей", "Астана", "Алматы", etc.

class Service(BaseModel):
    code: str
    name: str
    category: str  # "Гинекология", "Урология", "Кардиология", "МРТ", etc.
    duration_minutes: int
    cost: float

class TravelRecord(BaseModel):
    patient_iin: str
    departure_date: date
    return_date: Optional[date] = None

class TransactionPayload(BaseModel):
    id: Optional[str] = None
    patient_iin: str
    doctor_iin: str
    clinic_id: str
    service_code: str
    timestamp: datetime  # ISO Format timestamp

class RuleTriggerDetails(BaseModel):
    rule_id: str
    category: str  # "Hard Block", "Velocity Rules", "Cost & Splitting", "Cross-table Verification"
    severity: str  # "BLOCKED", "SUSPICION"
    message: str
    details: Optional[dict] = None

class TransactionResult(BaseModel):
    id: str
    payload: TransactionPayload
    patient: Optional[Patient] = None
    doctor: Optional[Doctor] = None
    clinic: Optional[Clinic] = None
    service: Optional[Service] = None
    status: str  # "APPROVED", "SUSPICION", "BLOCKED"
    rules_triggered: List[RuleTriggerDetails] = []
    processed_at: datetime
