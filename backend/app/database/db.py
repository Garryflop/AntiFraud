import threading
import random
from datetime import date, datetime, timedelta
from typing import Dict, List, Optional
from app.models.schemas import Patient, Doctor, Clinic, Service, TravelRecord, TransactionResult

# Thread safety lock
db_lock = threading.Lock()

class InMemoryDatabase:
    def __init__(self):
        self.patients: Dict[str, Patient] = {}
        self.doctors: Dict[str, Doctor] = {}
        self.clinics: Dict[str, Clinic] = {}
        self.services: Dict[str, Service] = {}
        self.travel_records: List[TravelRecord] = []
        self.transactions: List[TransactionResult] = []
        
        self.seed_data()

    def clear_all(self):
        with db_lock:
            self.patients.clear()
            self.doctors.clear()
            self.clinics.clear()
            self.services.clear()
            self.travel_records.clear()
            self.transactions.clear()
            self.seed_data()

    def seed_data(self):
        # 1. Seed Clinics
        clinic_names = [
            ("CL-01", "Медицинский центр 'Шығыс'", "Семей"),
            ("CL-02", "Городская больница №1", "Семей"),
            ("CL-03", "Национальный научный кардиоцентр", "Астана"),
            ("CL-04", "Клиника 'Daulet'", "Астана"),
            ("CL-05", "Центральная клиническая больница", "Алматы"),
            ("CL-06", "Медицинский центр 'Sana'", "Алматы"),
            ("CL-07", "Шымкентская городская поликлиника №2", "Шымкент"),
            ("CL-08", "Областная клиническая больница", "Караганда"),
            ("CL-09", "Атырауская областная больница", "Атырау"),
            ("CL-10", "Медицинский центр 'Маңғыстау'", "Актау"),
            ("CL-11", "Актюбинская многопрофильная больница", "Актобе"),
            ("CL-12", "Западно-Казахстанский кардиоцентр", "Уральск"),
            ("CL-13", "Костанайская городская больница", "Костанай"),
            ("CL-14", "Павлодарский диагностический центр", "Павлодар"),
            ("CL-15", "Восточно-Казахстанский областной центр", "Усть-Каменогорск"),
            ("CL-16", "Северо-Казахстанская поликлиника №1", "Петропавловск"),
            ("CL-17", "Акмолинская многопрофильная клиника", "Кокшетау"),
            ("CL-18", "Жамбылская областная больница", "Тараз"),
            ("CL-19", "Кызылординский медицинский центр", "Кызылорда"),
            ("CL-20", "Туркестанская областная поликлиника", "Туркестан"),
            ("CL-21", "Жетысуская многопрофильная больница", "Талдыкорган"),
            ("CL-22", "Многопрофильная больница г. Жезказган", "Жезказган"),
            ("CL-23", "Алматинская многопрофильная больница (г. Конаев)", "Конаев"),
        ]
        for cid, name, region in clinic_names:
            self.clinics[cid] = Clinic(id=cid, name=name, region=region)

        # 2. Seed Services
        # (code, name, category, duration_minutes, cost)
        services_list = [
            ("SRV-101", "Прием врача-гинеколога первичный", "Гинекология", 30, 7500.0),
            ("SRV-102", "УЗИ малого таза (трансвагинальное)", "Гинекология", 45, 12000.0),
            ("SRV-103", "Кольпоскопия", "Гинекология", 40, 9000.0),
            
            ("SRV-201", "Прием врача-уролога первичный", "Урология-Андрология", 30, 7500.0),
            ("SRV-202", "Массаж предстательной железы", "Урология-Андрология", 15, 5000.0),
            ("SRV-203", "УЗИ предстательной железы (ТРУЗИ)", "Урология-Андрология", 30, 10000.0),
            
            ("SRV-301", "Прием врача-кардиолога", "Кардиология", 30, 8000.0),
            ("SRV-302", "Электрокардиография (ЭКГ) с расшифровкой", "Кардиология", 20, 3500.0),
            ("SRV-303", "Суточное мониторирование ЭКГ по Холтеру", "Кардиология", 40, 15000.0),
            
            ("SRV-401", "Магнитно-резонансная томография (МРТ) головного мозга", "МРТ", 60, 45000.0),
            ("SRV-402", "МРТ пояснично-крестцового отдела позвоночника", "МРТ", 45, 42000.0),
            
            ("SRV-501", "Прием врача-терапевта общего профиля", "Терапия", 20, 5000.0),
            ("SRV-502", "Общий анализ крови (ОАК) развернутый", "Лаборатория", 10, 2500.0),
            ("SRV-503", "Общий анализ мочи (ОАМ)", "Лаборатория", 10, 1500.0),
        ]
        for code, name, category, duration, cost in services_list:
            self.services[code] = Service(
                code=code, name=name, category=category, duration_minutes=duration, cost=cost
            )

        # 3. Seed Patients
        # Generate some male and female patients, some deceased, and some with border crossings
        first_names_m = ["Нурсултан", "Бауыржан", "Алихан", "Арман", "Данияр", "Руслан", "Серик", "Асет", "Максат", "Тимур"]
        first_names_f = ["Айгерим", "Динара", "Мадина", "Аружан", "Сауле", "Жанар", "Камила", "Аида", "Зарина", "Гульнур"]
        last_names = ["Ахметов", "Ибрагимов", "Сулейменов", "Касымов", "Оспанов", "Смагулов", "Нурланов", "Алиев", "Садыков", "Омаров"]

        # Normal active male patients
        for i in range(15):
            iin = f"9001{i:02d}300{random.randint(100, 999)}"
            name = f"{random.choice(last_names)} {random.choice(first_names_m)}"
            self.patients[iin] = Patient(iin=iin, name=name, gender="M", status="ACTIVE")

        # Normal active female patients
        for i in range(15):
            iin = f"9202{i:02d}400{random.randint(100, 999)}"
            name = f"{random.choice(last_names)}а {random.choice(first_names_f)}" # added "а" for female last names
            self.patients[iin] = Patient(iin=iin, name=name, gender="F", status="ACTIVE")

        # Deceased patients (Dead Souls)
        deceased_names = [
            ("800512300456", "Карабаев Ербол", "M"),
            ("750824400789", "Смаилова Бахыт", "F"),
            ("881205300123", "Жумабаев Марат", "M"),
            ("620415400987", "Абдрахманова Роза", "F"),
        ]
        for iin, name, gender in deceased_names:
            self.patients[iin] = Patient(iin=iin, name=name, gender=gender, status="DECEASED")

        # 4. Seed Doctors
        specialties = ["Гинеколог", "Уролог", "Кардиолог", "Рентгенолог", "Терапевт"]
        doctor_names = [
            ("780512300451", "Асанов Канат", "Уролог", False),
            ("830920400122", "Есенова Динара", "Гинеколог", False),
            ("720415300741", "Искаков Мурат", "Кардиолог", False),
            ("850110400852", "Сыздыкова Ляззат", "Рентгенолог", False),
            ("801123300963", "Мусаев Болат", "Терапевт", False),
            # On vacation / leave doctors (Ghost Doctors)
            ("810311300951", "Тулегенов Серик", "Терапевт", True),
            ("840714400262", "Бекжанова Айгуль", "Гинеколог", True),
            ("760925300373", "Даутов Нурлан", "Кардиолог", True),
        ]
        
        # Add some regular active doctors
        for i, (iin, name, spec, on_leave) in enumerate(doctor_names):
            self.doctors[iin] = Doctor(iin=iin, name=name, specialty=spec, is_on_leave=on_leave)
            
        for i in range(10):
            iin = f"8003{i:02d}300{random.randint(100, 999)}"
            name = f"{random.choice(last_names)} {random.choice(first_names_m)} (Доктор)"
            spec = random.choice(specialties)
            self.doctors[iin] = Doctor(iin=iin, name=name, specialty=spec, is_on_leave=False)

        # 5. Seed Border Travel Records
        # We will make travel records overlap with July 2026 (the current simulated timeframe)
        # Some patients were abroad in July 2026
        # Let's assign travel dates to a few patients
        travel_patient_iins = list(self.patients.keys())[:5]
        
        self.travel_records.append(TravelRecord(
            patient_iin=travel_patient_iins[0],
            departure_date=date(2026, 7, 1),
            return_date=date(2026, 7, 10)
        ))
        self.travel_records.append(TravelRecord(
            patient_iin=travel_patient_iins[1],
            departure_date=date(2026, 7, 5),
            return_date=date(2026, 7, 20)
        ))
        self.travel_records.append(TravelRecord(
            patient_iin=travel_patient_iins[2],
            departure_date=date(2026, 7, 12),
            return_date=None  # Currently abroad
        ))
        self.travel_records.append(TravelRecord(
            patient_iin=travel_patient_iins[3],
            departure_date=date(2026, 6, 20),
            return_date=date(2026, 7, 4)
        ))

# Create a singleton database instance
db = InMemoryDatabase()
