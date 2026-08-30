from fastapi import APIRouter
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from collections import Counter, defaultdict
from app.models.schemas import TransactionResult
from app.database.db import db

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

def build_breadcrumbs(tx: TransactionResult) -> List[Dict[str, Any]]:
    breadcrumbs = []
    
    # Common format: timestamp, type, message, icon
    # Types: "info", "warning", "error", "success"
    # Icons: "User", "Activity", "MapPin", "Calendar", "AlertOctagon", "Globe"
    
    timestamp_str = tx.payload.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    
    # Find matching rule
    rule_ids = [r.rule_id for r in tx.rules_triggered]
    
    if "HARD_GENDER_CONFLICT" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "HARD_GENDER_CONFLICT")
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "info",
            "message": f"Профиль пациента: {tx.patient.name}, пол: {tx.patient.gender if tx.patient else 'М'}",
            "icon": "User"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "warning",
            "message": f"Запрос услуги: {tx.service.name if tx.service else 'Услуга'}, категория: {tx.service.category if tx.service else 'Категория'}",
            "icon": "Activity"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "error",
            "message": f"Ошибка: {rule.message}",
            "icon": "AlertOctagon"
        })
        
    elif "HARD_DEAD_SOUL" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "HARD_DEAD_SOUL")
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "info",
            "message": f"Запрос в реестр ЗАГС по ИИН: {tx.payload.patient_iin}",
            "icon": "User"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "warning",
            "message": f"Внимание: Гражданин {tx.patient.name if tx.patient else ''} имеет статус 'DECEASED' (УМЕР)",
            "icon": "Calendar"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "error",
            "message": f"Блокировка: {rule.message}",
            "icon": "AlertOctagon"
        })
        
    elif "HARD_GHOST_DOCTOR" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "HARD_GHOST_DOCTOR")
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "info",
            "message": f"Врач: {tx.doctor.name if tx.doctor else ''}, специальность: {tx.doctor.specialty if tx.doctor else ''}",
            "icon": "User"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "warning",
            "message": "Табель учета: Врач находится в отпуске/на больничном (is_on_leave = True)",
            "icon": "Calendar"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "error",
            "message": f"Блокировка: {rule.message}",
            "icon": "AlertOctagon"
        })
        
    elif "VELOCITY_RUBBER_DAY" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "VELOCITY_RUBBER_DAY")
        # Find other transactions by the same doctor on that day
        day_date = tx.payload.timestamp.date()
        doc_txs = [
            t for t in db.transactions
            if t.payload.doctor_iin == tx.payload.doctor_iin 
            and t.payload.timestamp.date() == day_date
            and t.id != tx.id
            and t.status != "BLOCKED"
        ]
        
        # Sort chronologically
        doc_txs = sorted(doc_txs, key=lambda x: x.payload.timestamp)
        for dtx in doc_txs[:5]: # Show up to 5 prior logs
            breadcrumbs.append({
                "timestamp": dtx.payload.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "type": "info",
                "message": f"Услуга: '{dtx.service.name}', длительность: {dtx.service.duration_minutes} мин. Клиника: '{dtx.clinic.name}'",
                "icon": "Activity"
            })
        if len(doc_txs) > 5:
            breadcrumbs.append({
                "timestamp": timestamp_str,
                "type": "info",
                "message": f"...и еще {len(doc_txs) - 5} транзакций врача за этот день",
                "icon": "Activity"
            })
            
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "warning",
            "message": f"Текущий запрос: '{tx.service.name}', длительность: {tx.service.duration_minutes} мин",
            "icon": "Activity"
        })
        
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "error",
            "message": f"Блокировка: {rule.message}",
            "icon": "AlertOctagon"
        })
        
    elif "VELOCITY_TELEPORTATION" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "VELOCITY_TELEPORTATION")
        details = rule.details or {}
        breadcrumbs.append({
            "timestamp": details.get("other_time", timestamp_str) + ":00",
            "type": "warning",
            "message": f"Транзакция А: город {details.get('other_city')}, клиника {tx.clinic.name if tx.clinic else ''}",
            "icon": "MapPin"
        })
        breadcrumbs.append({
            "timestamp": details.get("current_time", timestamp_str) + ":00",
            "type": "warning",
            "message": f"Транзакция Б: город {details.get('current_city')}, клиника {tx.clinic.name if tx.clinic else ''}",
            "icon": "MapPin"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "error",
            "message": f"Блокировка: {rule.message} (Скорость перемещения: {details.get('required_speed_kmh')} км/ч)",
            "icon": "AlertOctagon"
        })
        
    elif "FINANCIAL_SPLITTING" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "FINANCIAL_SPLITTING")
        # Find splitting transactions
        day_date = tx.payload.timestamp.date()
        split_txs = [
            t for t in db.transactions
            if t.payload.patient_iin == tx.payload.patient_iin
            and t.payload.clinic_id == tx.payload.clinic_id
            and t.payload.timestamp.date() == day_date
            and t.status != "BLOCKED"
        ]
        split_txs = sorted(split_txs, key=lambda x: x.payload.timestamp)
        
        for stx in split_txs:
            breadcrumbs.append({
                "timestamp": stx.payload.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "type": "info",
                "message": f"Выписка услуги: '{stx.service.name}', стоимость: {stx.service.cost} KZT",
                "icon": "Activity"
            })
            
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "warning",
            "message": f"Подозрение: {rule.message}",
            "icon": "AlertOctagon"
        })
        
    elif "CROSS_BORDER_OVERLAP" in rule_ids:
        rule = next(r for r in tx.rules_triggered if r.rule_id == "CROSS_BORDER_OVERLAP")
        details = rule.details or {}
        breadcrumbs.append({
            "timestamp": details.get("departure_date") + " 00:00:00",
            "type": "info",
            "message": f"Погранслужба КНБ: Гражданин {tx.patient.name if tx.patient else ''} пересек границу (ВЫЕЗД)",
            "icon": "Globe"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "warning",
            "message": f"Запрос клиники: предоставление услуги '{tx.service.name}' пациенту в Казахстане",
            "icon": "Activity"
        })
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "error",
            "message": f"Блокировка: {rule.message}",
            "icon": "AlertOctagon"
        })
        
    else:
        breadcrumbs.append({
            "timestamp": timestamp_str,
            "type": "info",
            "message": f"Транзакция проверена. Статус: {tx.status}",
            "icon": "Activity"
        })
        
    return breadcrumbs

@router.get("/stats")
def get_stats(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    transactions = db.transactions
    
    # Filter by date if provided (Format: YYYY-MM-DD)
    if start_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            transactions = [tx for tx in transactions if tx.payload.timestamp >= s_dt]
        except Exception:
            pass
            
    if end_date:
        try:
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            transactions = [tx for tx in transactions if tx.payload.timestamp < e_dt]
        except Exception:
            pass

    total_txs = len(transactions)
    blocked_txs = [tx for tx in transactions if tx.status == "BLOCKED"]
    suspicion_txs = [tx for tx in transactions if tx.status == "SUSPICION"]
    
    blocked_count = len(blocked_txs)
    suspicion_count = len(suspicion_txs)
    
    # Sum up cost for blocked transactions (losses prevented)
    prevented_losses = sum(tx.service.cost for tx in blocked_txs if tx.service)
    
    # Clinics risk mapping: group by clinic and count blocked + suspicion
    clinic_anomalies = defaultdict(int)
    for tx in transactions:
        if tx.status in ["BLOCKED", "SUSPICION"]:
            clinic_anomalies[tx.payload.clinic_id] += 1
            
    # Red zone clinics (more than 3 fraud/suspicion events)
    red_zone_clinics = [cid for cid, count in clinic_anomalies.items() if count >= 3]
    red_zone_count = len(red_zone_clinics)

    # 1. Trend by day
    days_data = defaultdict(lambda: {"approved": 0, "suspicion": 0, "blocked": 0})
    for tx in transactions:
        date_str = tx.payload.timestamp.strftime("%Y-%m-%d")
        status_key = tx.status.lower() # approved, suspicion, blocked
        days_data[date_str][status_key] += 1
        
    trend_by_day = []
    for d_str in sorted(days_data.keys()):
        trend_by_day.append({
            "date": d_str,
            "approved": days_data[d_str]["approved"],
            "suspicion": days_data[d_str]["suspicion"],
            "blocked": days_data[d_str]["blocked"]
        })
        
    if not trend_by_day:
        trend_by_day = [{"date": datetime.now().strftime("%Y-%m-%d"), "approved": 0, "suspicion": 0, "blocked": 0}]

    # 2. Region distribution
    region_data = defaultdict(lambda: {"approved": 0, "suspicion": 0, "blocked": 0})
    for tx in transactions:
        region = tx.clinic.region if tx.clinic else "Неизвестно"
        status_key = tx.status.lower()
        region_data[region][status_key] += 1
        
    region_distribution = []
    for reg, stats in region_data.items():
        region_distribution.append({
            "region": reg,
            "approved": stats["approved"],
            "suspicion": stats["suspicion"],
            "blocked": stats["blocked"],
            "total": stats["approved"] + stats["suspicion"] + stats["blocked"]
        })
    region_distribution = sorted(region_distribution, key=lambda x: x["total"], reverse=True)

    # 3. Top 5 scamming services
    scam_services = []
    for tx in transactions:
        if tx.status in ["BLOCKED", "SUSPICION"] and tx.service:
            scam_services.append(tx.service.name)
            
    scam_counter = Counter(scam_services)
    top_scammed_services = []
    for s_name, count in scam_counter.most_common(5):
        top_scammed_services.append({
            "name": s_name,
            "count": count
        })

    return {
        "kpis": {
            "total_checked": total_txs,
            "prevented_losses_kzt": prevented_losses,
            "blocked_count": blocked_count,
            "red_zone_clinics_count": red_zone_count,
            "suspicion_count": suspicion_count
        },
        "charts": {
            "trend_by_day": trend_by_day,
            "region_distribution": region_distribution,
            "top_scammed_services": top_scammed_services
        }
    }

@router.get("/cases")
def get_cases(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    transactions = db.transactions
    if start_date:
        try:
            s_dt = datetime.strptime(start_date, "%Y-%m-%d")
            transactions = [tx for tx in transactions if tx.payload.timestamp >= s_dt]
        except Exception:
            pass
    if end_date:
        try:
            e_dt = datetime.strptime(end_date, "%Y-%m-%d") + timedelta(days=1)
            transactions = [tx for tx in transactions if tx.payload.timestamp < e_dt]
        except Exception:
            pass

    cases = []
    for tx in transactions:
        if tx.status in ["BLOCKED", "SUSPICION"]:
            breadcrumbs = build_breadcrumbs(tx)
            risk_level = "High" if tx.status == "BLOCKED" else "Medium"
            
            cases.append({
                "transaction_id": tx.id,
                "timestamp": tx.payload.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "patient": tx.patient,
                "doctor": tx.doctor,
                "clinic": tx.clinic,
                "service": tx.service,
                "status": tx.status,
                "risk_level": risk_level,
                "rules_triggered": tx.rules_triggered,
                "breadcrumbs": breadcrumbs
            })
            
    cases = sorted(cases, key=lambda x: x["timestamp"], reverse=True)
    return cases
