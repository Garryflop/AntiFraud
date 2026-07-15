from datetime import datetime, timedelta
import math
from typing import List, Dict, Tuple, Optional
from app.models.schemas import TransactionPayload, TransactionResult, RuleTriggerDetails, Patient, Doctor, Clinic, Service
from app.database.db import db, db_lock

# Distance dictionary between Kazakhstan regions/cities in km
CITY_DISTANCES: Dict[Tuple[str, str], float] = {
    ("Астана", "Семей"): 700.0,
    ("Астана", "Алматы"): 1000.0,
    ("Астана", "Шымкент"): 1200.0,
    ("Астана", "Караганда"): 200.0,
    ("Алматы", "Семей"): 1000.0,
    ("Алматы", "Шымкент"): 700.0,
    ("Алматы", "Караганда"): 1000.0,
    ("Шымкент", "Семей"): 1500.0,
    ("Шымкент", "Караганда"): 1000.0,
    ("Семей", "Караганда"): 800.0,
}

def get_distance(city1: str, city2: str) -> float:
    if city1 == city2:
        return 0.0
    # Try both ordering keys
    if (city1, city2) in CITY_DISTANCES:
        return CITY_DISTANCES[(city1, city2)]
    if (city2, city1) in CITY_DISTANCES:
        return CITY_DISTANCES[(city2, city1)]
    # Default fallback distance for any other combination
    return 500.0

class FraudDetector:
    @staticmethod
    def check_transaction(payload: TransactionPayload) -> TransactionResult:
        with db_lock:
            # 1. Fetch metadata from DB
            patient = db.patients.get(payload.patient_iin)
            doctor = db.doctors.get(payload.doctor_iin)
            clinic = db.clinics.get(payload.clinic_id)
            service = db.services.get(payload.service_code)

            # Fallbacks for missing database references (for ad-hoc testing)
            if not patient:
                patient = Patient(iin=payload.patient_iin, name="Неизвестный Пациент", gender="F", status="ACTIVE")
            if not doctor:
                doctor = Doctor(iin=payload.doctor_iin, name="Неизвестный Врач", specialty="Терапевт", is_on_leave=False)
            if not clinic:
                clinic = Clinic(id=payload.clinic_id, name="Неизвестная Клиника", region="Астана")
            if not service:
                service = Service(code=payload.service_code, name="Неизвестная Услуга", category="Терапия", duration_minutes=30, cost=5000.0)

            rules_triggered: List[RuleTriggerDetails] = []
            
            # --- CATEGORY 1: HARD BLOCK ---
            
            # Rule 1.1: Gender Conflict
            gender_conflict = False
            details_gender = {}
            if service.category == "Гинекология" and patient.gender == "M":
                gender_conflict = True
                details_gender = {"expected": "F", "actual": "M", "service_category": "Гинекология"}
            elif service.category == "Урология-Андрология" and patient.gender == "F":
                gender_conflict = True
                details_gender = {"expected": "M", "actual": "F", "service_category": "Урология-Андрология"}
            
            if gender_conflict:
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="HARD_GENDER_CONFLICT",
                    category="Hard Block",
                    severity="BLOCKED",
                    message=f"Гендерный конфликт: пациент с полом '{patient.gender}' записан на услугу из категории '{service.category}'",
                    details=details_gender
                ))

            # Rule 1.2: Dead Souls (Приписки на умерших)
            if patient.status == "DECEASED":
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="HARD_DEAD_SOUL",
                    category="Hard Block",
                    severity="BLOCKED",
                    message=f"Приписка на умершего: пациент '{patient.name}' числится в базе ЗАГС как умерший (DECEASED)",
                    details={"patient_status": "DECEASED"}
                ))

            # Rule 1.3: Ghost Doctor (Врач-призрак)
            if doctor.is_on_leave:
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="HARD_GHOST_DOCTOR",
                    category="Hard Block",
                    severity="BLOCKED",
                    message=f"Врач-призрак: врач '{doctor.name}' находится в отпуске или на больничном",
                    details={"doctor_is_on_leave": True}
                ))

            # --- CATEGORY 2: VELOCITY RULES ---
            
            # Gather other transactions for the same day (approved or suspicion or pending)
            day_start = datetime.combine(payload.timestamp.date(), datetime.min.time())
            day_end = datetime.combine(payload.timestamp.date(), datetime.max.time())
            
            same_day_txs = [
                tx for tx in db.transactions
                if tx.payload.timestamp.date() == payload.timestamp.date() and tx.status != "BLOCKED"
            ]

            # Rule 2.1: Rubber Day (Резиновый день врача)
            doctor_day_txs = [tx for tx in same_day_txs if tx.payload.doctor_iin == payload.doctor_iin]
            total_minutes = sum(tx.service.duration_minutes for tx in doctor_day_txs) + service.duration_minutes
            if total_minutes > 840:  # 14 hours
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="VELOCITY_RUBBER_DAY",
                    category="Velocity Rules",
                    severity="BLOCKED",
                    message=f"Резиновый день: суммарная длительность услуг врача '{doctor.name}' за {payload.timestamp.strftime('%Y-%m-%d')} составляет {total_minutes} минут (> 14 часов)",
                    details={"total_duration_minutes": total_minutes, "limit_minutes": 840}
                ))

            # Rule 2.2: Patient Teleportation (Телепортация пациента)
            # Find any other transaction by the same patient on the same day
            patient_day_txs = [tx for tx in same_day_txs if tx.payload.patient_iin == payload.patient_iin]
            
            teleportation_detected = False
            teleport_details = {}
            for other_tx in patient_day_txs:
                other_clinic = db.clinics.get(other_tx.payload.clinic_id)
                other_city = other_clinic.region if other_clinic else "Астана"
                
                if other_city != clinic.region:
                    # Calculate time difference
                    time_diff = abs((payload.timestamp - other_tx.payload.timestamp).total_seconds()) / 60.0 # in minutes
                    distance = get_distance(clinic.region, other_city)
                    
                    # If time difference is small for distinct cities
                    # e.g., 700km in 30 mins requires speed = 1400 km/h
                    # Speed = distance / (time_diff / 60)
                    if time_diff > 0:
                        speed_kmh = distance / (time_diff / 60.0)
                    else:
                        speed_kmh = 9999.0 # Instantaneous teleportation
                        
                    # Let's say speed > 150 km/h (meaning they couldn't drive or fly in that time)
                    if speed_kmh > 150.0:
                        teleportation_detected = True
                        teleport_details = {
                            "current_city": clinic.region,
                            "current_time": payload.timestamp.strftime("%Y-%m-%d %H:%M"),
                            "other_city": other_city,
                            "other_time": other_tx.payload.timestamp.strftime("%Y-%m-%d %H:%M"),
                            "distance_km": distance,
                            "time_difference_minutes": time_diff,
                            "required_speed_kmh": round(speed_kmh, 2)
                        }
                        break
            
            if teleportation_detected:
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="VELOCITY_TELEPORTATION",
                    category="Velocity Rules",
                    severity="BLOCKED",
                    message=f"Телепортация пациента: пациент записан в '{clinic.region}' в {payload.timestamp.strftime('%H:%M')}, а также в '{teleport_details['other_city']}' в {teleport_details['other_time']}",
                    details=teleport_details
                ))

            # --- CATEGORY 3: COST & SPLITTING (Финансовые паттерны) ---
            
            # Rule 3.1: Splitting (Дробление)
            # 5 or more transactions within 2 hours for the same patient at the same clinic
            patient_clinic_txs = [
                tx for tx in db.transactions
                if tx.payload.patient_iin == payload.patient_iin 
                and tx.payload.clinic_id == payload.clinic_id
                and tx.status != "BLOCKED"
            ]
            
            # Add current payload timestamp to list to evaluate the window
            all_timestamps = [tx.payload.timestamp for tx in patient_clinic_txs] + [payload.timestamp]
            all_timestamps.sort()
            
            splitting_detected = False
            splitting_details = {}
            for t in all_timestamps:
                # Count how many fall in [t, t + 2 hours]
                window_end = t + timedelta(hours=2)
                txs_in_window = [ts for ts in all_timestamps if t <= ts <= window_end]
                if len(txs_in_window) >= 5:
                    splitting_detected = True
                    splitting_details = {
                        "transactions_count": len(txs_in_window),
                        "window_start": t.strftime("%H:%M"),
                        "window_end": window_end.strftime("%H:%M"),
                        "clinic_id": payload.clinic_id
                    }
                    break
                    
            if splitting_detected:
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="FINANCIAL_SPLITTING",
                    category="Cost & Splitting",
                    severity="SUSPICION",
                    message=f"Дробление услуг: обнаружено {splitting_details['transactions_count']} транзакций на одного пациента в течение 2 часов в одной клинике",
                    details=splitting_details
                ))

            # --- CATEGORY 4: CROSS-TABLE VERIFICATION ---
            
            # Rule 4.1: Border Travel overlap (Сверка с базой Погранслужбы)
            was_abroad = False
            travel_details = {}
            tx_date = payload.timestamp.date()
            for record in db.travel_records:
                if record.patient_iin == payload.patient_iin:
                    dep = record.departure_date
                    ret = record.return_date
                    
                    if dep <= tx_date:
                        if ret is None or tx_date <= ret:
                            was_abroad = True
                            travel_details = {
                                "departure_date": dep.strftime("%Y-%m-%d"),
                                "return_date": ret.strftime("%Y-%m-%d") if ret else "по настоящее время",
                                "transaction_date": tx_date.strftime("%Y-%m-%d")
                            }
                            break
                            
            if was_abroad:
                rules_triggered.append(RuleTriggerDetails(
                    rule_id="CROSS_BORDER_OVERLAP",
                    category="Cross-table Verification",
                    severity="BLOCKED",
                    message=f"Конфликт Погранслужбы: пациент находился за границей в период с {travel_details['departure_date']} по {travel_details['return_date']}",
                    details=travel_details
                ))

            # Determine overall transaction status based on rules triggered
            # Priority: BLOCKED > SUSPICION > APPROVED
            status = "APPROVED"
            for rule in rules_triggered:
                if rule.severity == "BLOCKED":
                    status = "BLOCKED"
                    break
                elif rule.severity == "SUSPICION":
                    status = "SUSPICION"

            # Create transaction result
            import uuid
            tx_id = payload.id or str(uuid.uuid4())
            result = TransactionResult(
                id=tx_id,
                payload=payload,
                patient=patient,
                doctor=doctor,
                clinic=clinic,
                service=service,
                status=status,
                rules_triggered=rules_triggered,
                processed_at=datetime.utcnow()
            )
            
            # Append transaction to history
            db.transactions.append(result)
            return result
