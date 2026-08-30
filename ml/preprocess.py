import pandas as pd
import numpy as np
import os
import glob

def load_and_preprocess_dataset(data_dir):
    """
    Loads historical ophthalmosurgery CSV files (TDSheet.csv, 2023.csv, 2024.csv, 2025.csv),
    cleans missing values, calculates domain features for Anti-Fraud ML model.
    """
    print(f"[ML Preprocess] Loading data from {data_dir}...")
    files = [
        os.path.join(data_dir, "TDSheet.csv"),
        os.path.join(data_dir, "2023.csv"),
        os.path.join(data_dir, "2024.csv"),
        os.path.join(data_dir, "2025.csv")
    ]
    
    dfs = []
    for fpath in files:
        if os.path.exists(fpath):
            print(f" Reading {os.path.basename(fpath)}...")
            df_curr = pd.read_csv(fpath, low_memory=False)
            dfs.append(df_curr)
            
    if not dfs:
        raise FileNotFoundError(f"No CSV data files found in {data_dir}")
        
    df = pd.concat(dfs, ignore_index=True)
    # Deduplicate by transaction ID if present
    if 'Идентификатор' in df.columns:
        df = df.drop_duplicates(subset=['Идентификатор'])
        
    print(f"[ML Preprocess] Total unique records loaded: {len(df):,}")
    
    # Parse dates
    df['period_dt'] = pd.to_datetime(df['Период услуги'], format='%d.%m.%Y %H:%M:%S', errors='coerce')
    df['upload_dt'] = pd.to_datetime(df['Дата загрузки'], format='%d.%m.%Y %H:%M:%S', errors='coerce')
    df['birth_dt'] = pd.to_datetime(df['Дата рождения'], format='%d.%m.%Y', errors='coerce')
    
    # Feature 1: Retroactive upload delay in hours
    df['upload_delay_hours'] = (df['upload_dt'] - df['period_dt']).dt.total_seconds() / 3600.0
    df['upload_delay_hours'] = df['upload_delay_hours'].fillna(0).clip(lower=0)
    
    # Feature 2: Patient age
    ref_date = pd.Timestamp("2026-07-01")
    df['patient_age'] = (ref_date - df['birth_dt']).dt.days / 365.25
    df['patient_age'] = df['patient_age'].fillna(45.0).clip(lower=0, upper=110)
    
    # Feature 3: Patient daily service velocity (services rendered on same date to same patient)
    df['service_date'] = df['period_dt'].dt.date
    patient_daily_counts = df.groupby(['Пациент', 'service_date'])['Идентификатор'].transform('count')
    df['patient_daily_velocity'] = patient_daily_counts.fillna(1)
    
    # Feature 4: Amount & Price Z-Score per ICD-10 Diagnosis code
    df['Сумма'] = pd.to_numeric(df['Сумма'], errors='coerce').fillna(0.0)
    icd_stats = df.groupby('Код диагноза МКБ10')['Сумма'].agg(['mean', 'std']).reset_index()
    icd_stats['std'] = icd_stats['std'].replace(0, 1.0).fillna(1.0)
    
    df = df.merge(icd_stats, on='Код диагноза МКБ10', how='left')
    df['cost_zscore_by_icd'] = (df['Сумма'] - df['mean']) / df['std']
    df['cost_zscore_by_icd'] = df['cost_zscore_by_icd'].fillna(0.0).clip(lower=-5.0, upper=10.0)
    
    # Feature 5: Provider daily volume
    provider_daily = df.groupby(['Поставщик', 'service_date'])['Идентификатор'].transform('count')
    df['provider_daily_volume'] = provider_daily.fillna(1)
    
    # Feature 6: Subcontractor flag
    df['has_subcontractor'] = df['Субподрядчик'].notna().astype(int)
    
    # Feature 7: Additional service flag
    df['is_extra_service'] = (df['Дополнительная услуга'].astype(str).str.lower() == 'да').astype(int)
    
    # Feature 8: Estimated synthetic target label for supervised baseline evaluation
    # High-risk condition: (velocity >= 4) OR (delay >= 72 hours) OR (cost_zscore > 3.5)
    df['is_anomalous'] = (
        (df['patient_daily_velocity'] >= 4) | 
        (df['upload_delay_hours'] >= 72.0) | 
        (df['cost_zscore_by_icd'] >= 3.5)
    ).astype(int)
    
    feature_cols = [
        'upload_delay_hours',
        'patient_age',
        'patient_daily_velocity',
        'cost_zscore_by_icd',
        'provider_daily_volume',
        'has_subcontractor',
        'is_extra_service',
        'Сумма'
    ]
    
    X = df[feature_cols].copy()
    X = X.fillna(0.0)
    y = df['is_anomalous'].values
    
    return X, y, df

if __name__ == "__main__":
    data_dir = r"c:\Users\harry\OneDrive\Documents\Nurdaulet\AntiFraud\data"
    X, y, df = load_and_preprocess_dataset(data_dir)
    print(f"[ML Preprocess Success] Feature matrix shape: {X.shape}, Anomalies ratio: {y.mean():.2%}")
