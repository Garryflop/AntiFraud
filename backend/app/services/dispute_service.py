import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional
from app.models.dispute_schemas import ClinicDispute

class DisputeService:
    def __init__(self):
        self.disputes: Dict[str, ClinicDispute] = {}
        self.seed_mock_disputes()

    def seed_mock_disputes(self):
        now = datetime.now()
        mock_data = [
            {
                "id": "DISP-101",
                "claim_id": "TX-948201",
                "clinic_id": "CL-01",
                "clinic_name": "ТОО Медицинский центр 'Шығыс' (г. Семей)",
                "clinic_email": "buhgalteriya@shygys-med.kz",
                "service_code": "D95.027.324",
                "service_name": "Офтальмохирургия (Факоэмульсификация катаракты)",
                "amount_kzt": 450000.0,
                "rejection_reason": "ML Аномалия: Множественная повторная запись (Резиновый день - 8 услуг за 1 день) + задержка 120 часов",
                "ml_risk_score": 92.4,
                "created_at": now - timedelta(hours=14),
                "deadline_at": now + timedelta(hours=58),
                "status": "PENDING_JUSTIFICATION"
            },
            {
                "id": "DISP-102",
                "claim_id": "TX-839102",
                "clinic_id": "CL-05",
                "clinic_name": "Центральная клиническая больница (г. Алматы)",
                "clinic_email": "osms@ckb-almaty.kz",
                "service_code": "SRV-401",
                "service_name": "МРТ орбиты глаза с контрастированием",
                "amount_kzt": 85000.0,
                "rejection_reason": "Приписка у умершего гражданина (STATUS: DECEASED)",
                "ml_risk_score": 98.9,
                "created_at": now - timedelta(hours=75),
                "deadline_at": now - timedelta(hours=3),
                "status": "REJECTED_SANCTIONED",
                "justification_text": None,
                "penalty_amount_kzt": 170000.0
            },
            {
                "id": "DISP-103",
                "claim_id": "TX-774109",
                "clinic_id": "CL-21",
                "clinic_name": "Жетысуская многопрофильная больница (г. Талдыкорган)",
                "clinic_email": "info@zhetysu-med.kz",
                "service_code": "A02.023.000",
                "service_name": "Консультация врача-офтальмолога высшей категории",
                "amount_kzt": 15000.0,
                "rejection_reason": "Дублирование счета с субподрядчиком",
                "ml_risk_score": 68.2,
                "created_at": now - timedelta(hours=20),
                "deadline_at": now + timedelta(hours=52),
                "status": "JUSTIFICATION_SUBMITTED",
                "justification_text": "Пациент направлен по экстренному показанию. Прилагаем протокол осмотра и снимки глазного дна.",
                "justification_files": ["protocol_taldykorgan_774.pdf", "scan_eye_774.jpg"]
            }
        ]

        for item in mock_data:
            dispute = ClinicDispute(**item)
            self.disputes[dispute.id] = dispute

    def create_dispute(self, claim_id: str, clinic_id: str, clinic_name: str, clinic_email: str,
                       service_code: str, service_name: str, amount_kzt: float,
                       rejection_reason: str, ml_risk_score: float) -> ClinicDispute:
        now = datetime.now()
        disp_id = f"DISP-{uuid.uuid4().hex[:6].upper()}"
        dispute = ClinicDispute(
            id=disp_id,
            claim_id=claim_id,
            clinic_id=clinic_id,
            clinic_name=clinic_name,
            clinic_email=clinic_email,
            service_code=service_code,
            service_name=service_name,
            amount_kzt=amount_kzt,
            rejection_reason=rejection_reason,
            ml_risk_score=ml_risk_score,
            created_at=now,
            deadline_at=now + timedelta(hours=72),  # 72 hours window
            status="PENDING_JUSTIFICATION"
        )
        self.disputes[disp_id] = dispute
        return dispute

    def get_all(self) -> List[ClinicDispute]:
        now = datetime.now()
        # Check expired deadlines
        for d in self.disputes.values():
            if d.status == "PENDING_JUSTIFICATION" and now > d.deadline_at:
                d.status = "REJECTED_SANCTIONED"
                d.penalty_amount_kzt = d.amount_kzt * 2.0  # 200% penalty fine for non-response
        return list(self.disputes.values())

    def submit_justification(self, dispute_id: str, text: str, files: Optional[List[str]] = None) -> Optional[ClinicDispute]:
        if dispute_id not in self.disputes:
            return None
        disp = self.disputes[dispute_id]
        disp.justification_text = text
        disp.justification_files = files or []
        disp.submitted_at = datetime.now()
        disp.status = "JUSTIFICATION_SUBMITTED"
        return disp

    def resolve_dispute(self, dispute_id: str, action: str, auditor_comment: str = "") -> Optional[ClinicDispute]:
        if dispute_id not in self.disputes:
            return None
        disp = self.disputes[dispute_id]
        disp.resolved_at = datetime.now()
        if action.upper() == "APPROVE":
            disp.status = "APPROVED_PAID"
            disp.penalty_amount_kzt = 0.0
        else:
            disp.status = "REJECTED_SANCTIONED"
            disp.penalty_amount_kzt = disp.amount_kzt * 2.0  # Apply penalty sanctions
        return disp

dispute_service = DisputeService()
