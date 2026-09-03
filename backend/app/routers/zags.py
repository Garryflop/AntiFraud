from fastapi import APIRouter, Query, HTTPException
from typing import List, Dict, Any, Optional
from datetime import datetime
from app.models.schemas import Patient
from app.database.db import db

router = APIRouter(prefix="/api/zags", tags=["ZAGS / Civil Registry"])

@router.get("/citizens")
def get_citizens(
    search: Optional[str] = None,
    status: Optional[str] = "ALL",  # ALL, ACTIVE, DECEASED
    gender: Optional[str] = "ALL",  # ALL, M, F
    page: int = 1,
    page_size: int = 50
):
    """
    Returns simulated ZAGS database registry of citizens with search, status filters, and transaction history stats.
    """
    patients_list = list(db.patients.values())
    
    # Calculate stats
    total_citizens = len(patients_list)
    active_count = sum(1 for p in patients_list if p.status == "ACTIVE")
    deceased_count = sum(1 for p in patients_list if p.status == "DECEASED")

    # Calculate attempted transactions count per IIN
    tx_counts = {}
    for tx in db.transactions:
        iin = tx.payload.patient_iin
        tx_counts[iin] = tx_counts.get(iin, 0) + 1

    # Filter
    filtered = patients_list
    if status and status != "ALL":
        filtered = [p for p in filtered if p.status == status]

    if gender and gender != "ALL":
        filtered = [p for p in filtered if p.gender == gender]

    if search:
        s = search.strip().lower()
        filtered = [
            p for p in filtered 
            if s in p.iin.lower() or s in p.name.lower() or (p.region and s in p.region.lower())
        ]

    # Sort: DECEASED first, then by name
    filtered.sort(key=lambda p: (0 if p.status == "DECEASED" else 1, p.name))

    start_idx = (page - 1) * page_size
    end_idx = start_idx + page_size
    paginated = filtered[start_idx:end_idx]

    items = []
    for p in paginated:
        items.append({
            "iin": p.iin,
            "name": p.name,
            "gender": p.gender,
            "status": p.status,
            "birth_date": p.birth_date or "1985-01-01",
            "death_date": p.death_date if p.status == "DECEASED" else None,
            "region": p.region or "Семей",
            "tx_count": tx_counts.get(p.iin, 0)
        })

    return {
        "total": len(filtered),
        "page": page,
        "page_size": page_size,
        "active_count": active_count,
        "deceased_count": deceased_count,
        "total_citizens": total_citizens,
        "items": items
    }

@router.get("/check/{iin}")
def check_citizen_by_iin(iin: str):
    """
    Lookup a 12-digit IIN in ZAGS database and return detailed status (ACTIVE vs DECEASED) + suspicious attempts log.
    """
    clean_iin = iin.strip()
    
    patient = db.patients.get(clean_iin)
    
    if not patient:
        # If IIN is not in database seed, generate a dynamic mock citizen profile
        # Determine gender based on 7th digit if 12 digits
        gender = "M"
        if len(clean_iin) >= 7:
            try:
                g_digit = int(clean_iin[6])
                if g_digit % 2 == 0:
                    gender = "F"
            except ValueError:
                pass
                
        patient = Patient(
            iin=clean_iin,
            name="Неизвестный Гражданин (Из внешнего реестра)",
            gender=gender,
            status="ACTIVE",
            birth_date="1990-06-15",
            region="Казахстан"
        )

    # Gather all transaction history for this patient
    patient_txs = [tx for tx in db.transactions if tx.payload.patient_iin == clean_iin]
    patient_txs.sort(key=lambda x: x.payload.timestamp, reverse=True)

    formatted_txs = []
    for tx in patient_txs:
        formatted_txs.append({
            "id": tx.id,
            "timestamp": tx.payload.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            "clinic_id": tx.payload.clinic_id,
            "clinic_name": tx.clinic.name if tx.clinic else tx.payload.clinic_id,
            "clinic_region": tx.clinic.region if tx.clinic else "—",
            "service_name": tx.service.name if tx.service else tx.payload.service_code,
            "service_category": tx.service.category if tx.service else "—",
            "cost": tx.service.cost if tx.service else 0.0,
            "status": tx.status,
            "rules_triggered": [
                {
                    "rule_id": r.rule_id,
                    "severity": r.severity,
                    "message": r.message
                }
                for r in tx.rules_triggered
            ]
        })

    is_deceased = patient.status == "DECEASED"
    
    alert_message = ""
    if is_deceased:
        alert_message = (
            f"ВНИМАНИЕ! Гражданин {patient.name} (ИИН {patient.iin}) числится в Государственной базе "
            f"данных ЗАГС как УМЕРШИЙ (Дата смерти: {patient.death_date or 'Н/Д'}). "
            f"Оказание медицинских услуг и списание средств ФСМС КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ (Мертвые души)."
        )
    else:
        alert_message = (
            f"Статус подтвержден: Гражданин {patient.name} (ИИН {patient.iin}) числится ЖИВЫМ "
            f"в Государственной базе данных физических лиц (ГБД ФЛ)."
        )

    return {
        "found": True,
        "patient": {
            "iin": patient.iin,
            "name": patient.name,
            "gender": patient.gender,
            "status": patient.status,
            "birth_date": patient.birth_date or "1985-01-01",
            "death_date": patient.death_date,
            "region": patient.region or "Семей"
        },
        "is_deceased": is_deceased,
        "alert_message": alert_message,
        "total_claims_attempted": len(formatted_txs),
        "blocked_claims_count": sum(1 for t in formatted_txs if t["status"] == "BLOCKED"),
        "transactions": formatted_txs
    }
