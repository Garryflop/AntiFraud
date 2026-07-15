import random
import uuid
from datetime import datetime, timedelta, date
from typing import List
from app.models.schemas import TransactionPayload, TransactionResult
from app.database.db import db
from app.services.fraud_detector import FraudDetector

class LogGenerator:
    @staticmethod
    def generate_batch(count: int) -> List[TransactionResult]:
        results = []
        
        # We will split the generation: 85% normal, 15% fraud.
        fraud_count = int(count * 0.15)
        normal_count = count - fraud_count

        # For generating consecutive transactions in case of teleportation/splitting/rubber day,
        # we will generate them sequentially.
        
        # 1. Generate Normal Transactions
        active_patients = [p for p in db.patients.values() if p.status == "ACTIVE"]
        active_doctors = [d for d in db.doctors.values() if not d.is_on_leave]
        clinics_list = list(db.clinics.values())
        services_list = list(db.services.values())
        
        # Find which patients are NOT abroad during our simulated period (July 2026)
        abroad_iins = {r.patient_iin for r in db.travel_records}
        non_abroad_patients = [p for p in active_patients if p.iin not in abroad_iins]
        if not non_abroad_patients:
            non_abroad_patients = active_patients

        # Base timestamp to generate around: July 10-15, 2026
        base_time = datetime(2026, 7, 15, 12, 0, 0)

        for _ in range(normal_count):
            patient = random.choice(non_abroad_patients)
            doctor = random.choice(active_doctors)
            clinic = random.choice(clinics_list)
            
            # Select service appropriate for gender
            available_services = []
            for s in services_list:
                if s.category == "Гинекология" and patient.gender == "M":
                    continue
                if s.category == "Урология-Андрология" and patient.gender == "F":
                    continue
                available_services.append(s)
            
            service = random.choice(available_services) if available_services else random.choice(services_list)
            
            # Random time in the last 5 days
            tx_time = base_time - timedelta(
                days=random.randint(0, 5),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            payload = TransactionPayload(
                id=str(uuid.uuid4()),
                patient_iin=patient.iin,
                doctor_iin=doctor.iin,
                clinic_id=clinic.id,
                service_code=service.code,
                timestamp=tx_time
            )
            
            res = FraudDetector.check_transaction(payload)
            results.append(res)

        # 2. Generate Fraud Cases (15%)
        # Divide fraud cases equally among the categories
        fraud_types = [
            "gender_conflict",
            "dead_soul",
            "ghost_doctor",
            "rubber_day",
            "teleportation",
            "splitting",
            "travel_overlap"
        ]

        for _ in range(fraud_count):
            ftype = random.choice(fraud_types)
            tx_time = base_time - timedelta(
                days=random.randint(0, 5),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )

            if ftype == "gender_conflict":
                # Male getting Gynaecology or Female getting Urology
                if random.choice([True, False]):
                    male_patient = random.choice([p for p in db.patients.values() if p.gender == "M"])
                    gyn_service = random.choice([s for s in db.services.values() if s.category == "Гинекология"])
                    clinic = random.choice(clinics_list)
                    doctor = random.choice(active_doctors)
                    payload = TransactionPayload(
                        patient_iin=male_patient.iin,
                        doctor_iin=doctor.iin,
                        clinic_id=clinic.id,
                        service_code=gyn_service.code,
                        timestamp=tx_time
                    )
                else:
                    female_patient = random.choice([p for p in db.patients.values() if p.gender == "F"])
                    uro_service = random.choice([s for s in db.services.values() if s.category == "Урология-Андрология"])
                    clinic = random.choice(clinics_list)
                    doctor = random.choice(active_doctors)
                    payload = TransactionPayload(
                        patient_iin=female_patient.iin,
                        doctor_iin=doctor.iin,
                        clinic_id=clinic.id,
                        service_code=uro_service.code,
                        timestamp=tx_time
                    )
                results.append(FraudDetector.check_transaction(payload))

            elif ftype == "dead_soul":
                # Deceased patient
                deceased_patient = random.choice([p for p in db.patients.values() if p.status == "DECEASED"])
                doctor = random.choice(active_doctors)
                clinic = random.choice(clinics_list)
                service = random.choice(services_list)
                payload = TransactionPayload(
                    patient_iin=deceased_patient.iin,
                    doctor_iin=doctor.iin,
                    clinic_id=clinic.id,
                    service_code=service.code,
                    timestamp=tx_time
                )
                results.append(FraudDetector.check_transaction(payload))

            elif ftype == "ghost_doctor":
                # Doctor on leave
                ghost_doctor = random.choice([d for d in db.doctors.values() if d.is_on_leave])
                patient = random.choice(non_abroad_patients)
                clinic = random.choice(clinics_list)
                service = random.choice(services_list)
                payload = TransactionPayload(
                    patient_iin=patient.iin,
                    doctor_iin=ghost_doctor.iin,
                    clinic_id=clinic.id,
                    service_code=service.code,
                    timestamp=tx_time
                )
                results.append(FraudDetector.check_transaction(payload))

            elif ftype == "rubber_day":
                # Create a doctor with multiple services exceeding 14 hours (840 minutes)
                doctor = random.choice(active_doctors)
                patient = random.choice(non_abroad_patients)
                clinic = random.choice(clinics_list)
                mrt_service = db.services["SRV-401"] # 60 minutes
                
                # We need 15 services of 60 minutes on the same day to hit 900 minutes
                for i in range(15):
                    sub_time = datetime.combine(tx_time.date(), datetime.min.time()) + timedelta(hours=8, minutes=i*30)
                    payload = TransactionPayload(
                        patient_iin=patient.iin,
                        doctor_iin=doctor.iin,
                        clinic_id=clinic.id,
                        service_code=mrt_service.code,
                        timestamp=sub_time
                    )
                    res = FraudDetector.check_transaction(payload)
                    results.append(res)

            elif ftype == "teleportation":
                # Same patient in two different cities within 30 minutes
                patient = random.choice(non_abroad_patients)
                doctor1 = random.choice(active_doctors)
                doctor2 = random.choice(active_doctors)
                
                semey_clinic = db.clinics["CL-01"] # Semey
                astana_clinic = db.clinics["CL-03"] # Astana
                
                service = db.services["SRV-501"] # 20 mins
                
                t1 = tx_time
                t2 = tx_time + timedelta(minutes=30)
                
                payload1 = TransactionPayload(
                    patient_iin=patient.iin,
                    doctor_iin=doctor1.iin,
                    clinic_id=semey_clinic.id,
                    service_code=service.code,
                    timestamp=t1
                )
                payload2 = TransactionPayload(
                    patient_iin=patient.iin,
                    doctor_iin=doctor2.iin,
                    clinic_id=astana_clinic.id,
                    service_code=service.code,
                    timestamp=t2
                )
                
                results.append(FraudDetector.check_transaction(payload1))
                results.append(FraudDetector.check_transaction(payload2))

            elif ftype == "splitting":
                # 5 transactions in 2 hours
                patient = random.choice(non_abroad_patients)
                doctor = random.choice(active_doctors)
                clinic = random.choice(clinics_list)
                short_service = db.services["SRV-502"] # 10 mins
                
                for i in range(5):
                    sub_time = tx_time + timedelta(minutes=i*15) # 5 visits spaced 15 minutes apart (total 1 hour)
                    payload = TransactionPayload(
                        patient_iin=patient.iin,
                        doctor_iin=doctor.iin,
                        clinic_id=clinic.id,
                        service_code=short_service.code,
                        timestamp=sub_time
                    )
                    results.append(FraudDetector.check_transaction(payload))

            elif ftype == "travel_overlap":
                # Patient is travel-overlap
                # Fetch a patient with travel records
                travel_record = random.choice(db.travel_records)
                patient_iin = travel_record.patient_iin
                
                # Generate a timestamp that overlaps with the travel dates
                overlap_date = travel_record.departure_date + timedelta(days=2)
                overlap_time = datetime.combine(overlap_date, datetime.min.time()) + timedelta(hours=14)
                
                doctor = random.choice(active_doctors)
                clinic = random.choice(clinics_list)
                service = random.choice(services_list)
                
                payload = TransactionPayload(
                    patient_iin=patient_iin,
                    doctor_iin=doctor.iin,
                    clinic_id=clinic.id,
                    service_code=service.code,
                    timestamp=overlap_time
                )
                results.append(FraudDetector.check_transaction(payload))

        return results
