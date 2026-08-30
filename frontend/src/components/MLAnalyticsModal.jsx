import React, { useState, useEffect } from 'react';
import { Cpu, Activity, ShieldCheck, Database, Sliders, X, Sparkles, AlertTriangle } from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function MLAnalyticsModal({ isOpen, onClose }) {
  const [modelInfo, setModelInfo] = useState(null);
  const [testPayload, setTestPayload] = useState({
    patient_daily_velocity: 1,
    upload_delay_hours: 0,
    cost_zscore: 0.0,
    provider_daily_volume: 5,
    patient_age: 45,
    amount_kzt: 15000
  });
  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchModelInfo();
      runPredict();
    }
  }, [isOpen]);

  const fetchModelInfo = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ml/model-info`);
      if (res.ok) {
        const data = await res.json();
        setModelInfo(data);
      }
    } catch (e) {
      console.error("Failed to fetch ML info:", e);
    }
  };

  const runPredict = async () => {
    setPredicting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ml/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });
      if (res.ok) {
        const data = await res.json();
        setPrediction(data);
      }
    } catch (e) {
      console.error("Failed ML predict:", e);
    } finally {
      setPredicting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#150f23]/85 backdrop-blur-md p-4 animate-fade-in">
      {/* Modal Shell per DESIGN.md: Dark canvas #1f1633, Hairline #362d59, rounded-xl */}
      <div className="bg-[#1f1633] border border-[#362d59] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-[#362d59] bg-[#150f23] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-[#422082] border border-[#6a5fc1]/40 flex items-center justify-center text-[#c2ef4e]">
              <Cpu size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm uppercase tracking-wider font-sans">
                  AI / ML АНТИФРОД МОДЕЛЬ ФСМС
                </span>
                <span className="bg-[#c2ef4e] text-[#1f1633] text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] uppercase">
                  HYBRID ML PIPELINE
                </span>
              </div>
              <p className="text-[11px] text-[#bdb8c0] font-mono mt-0.5">
                Isolation Forest + Calibrated Random Forest Classifier • 148,604 исторических транзакций
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-md bg-[#3f3849]/50 hover:bg-[#3f3849] text-[#bdb8c0] hover:text-white flex items-center justify-center transition-all border border-[#362d59]"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 font-sans text-xs custom-scrollbar flex-1">

          {/* Model Performance Cards per DESIGN.md: Surface Night cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-md bg-[#150f23] border border-[#362d59]">
              <span className="text-[11px] text-[#bdb8c0] font-mono uppercase block">Выборка обучения</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">148 604</div>
              <span className="text-[10px] text-[#79628c] font-mono">записи (2023–2025 гг.)</span>
            </div>

            <div className="p-4 rounded-md bg-[#150f23] border border-[#362d59]">
              <span className="text-[11px] text-[#bdb8c0] font-mono uppercase block">Точность ROC-AUC</span>
              <div className="text-2xl font-extrabold text-[#c2ef4e] mt-1 font-mono">0.9980</div>
              <span className="text-[10px] text-emerald-400 font-mono">Калиброванная модель</span>
            </div>

            <div className="p-4 rounded-md bg-[#150f23] border border-[#362d59]">
              <span className="text-[11px] text-[#bdb8c0] font-mono uppercase block">Обработанный объем</span>
              <div className="text-2xl font-extrabold text-cyan-400 mt-1 font-mono">373.5 млн ₸</div>
              <span className="text-[10px] text-[#bdb8c0] font-mono">Офтальмохирургия</span>
            </div>

            <div className="p-4 rounded-md bg-[#150f23] border border-[#362d59]">
              <span className="text-[11px] text-[#bdb8c0] font-mono uppercase block">Архитектура ML</span>
              <div className="text-sm font-bold text-purple-300 mt-1.5 font-mono">IsoForest + RF</div>
              <span className="text-[10px] text-[#79628c] font-mono">Unsupervised + Supervised</span>
            </div>
          </div>

          {/* Interactive ML Simulator Playground */}
          <div className="p-5 rounded-md bg-[#150f23] border border-[#362d59] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sliders size={16} className="text-[#c2ef4e]" />
                <span>ИНТЕРАКТИВНЫЙ СИМУЛЯТОР ML RISK SCORE</span>
              </h3>
              <span className="text-[10px] font-mono text-[#79628c]">
                Ввод реальных параметров транзакции
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label className="text-[11px] text-[#bdb8c0] font-mono block mb-1.5">
                  Услуг на пациента в день (Velocity): <span className="text-[#c2ef4e] font-bold">{testPayload.patient_daily_velocity}</span>
                </label>
                <input 
                  type="range" min="1" max="15" 
                  value={testPayload.patient_daily_velocity}
                  onChange={(e) => setTestPayload({...testPayload, patient_daily_velocity: parseInt(e.target.value)})}
                  className="w-full accent-[#c2ef4e] cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#bdb8c0] font-mono block mb-1.5">
                  Задержка загрузки (часы): <span className="text-amber-400 font-bold">{testPayload.upload_delay_hours} ч</span>
                </label>
                <input 
                  type="range" min="0" max="300" 
                  value={testPayload.upload_delay_hours}
                  onChange={(e) => setTestPayload({...testPayload, upload_delay_hours: parseInt(e.target.value)})}
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#bdb8c0] font-mono block mb-1.5">
                  Z-Score отклонения цены МКБ-10: <span className="text-[#fa7faa] font-bold">{testPayload.cost_zscore} σ</span>
                </label>
                <input 
                  type="range" min="0" max="6" step="0.1"
                  value={testPayload.cost_zscore}
                  onChange={(e) => setTestPayload({...testPayload, cost_zscore: parseFloat(e.target.value)})}
                  className="w-full accent-[#fa7faa] cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button 
                onClick={runPredict}
                disabled={predicting}
                className="px-4 py-2 rounded-md bg-[#422082] hover:bg-[#6a5fc1] text-white font-mono font-bold text-xs uppercase tracking-wider shadow-md transition-all border border-[#6a5fc1]/50"
              >
                {predicting ? "Расчёт ML..." : "Оценить Risk Score"}
              </button>
            </div>

            {/* Prediction Result Display per DESIGN.md */}
            {prediction && (
              <div className="mt-4 p-4 rounded-md bg-[#1f1633] border border-[#362d59] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className={`w-16 h-16 rounded-md flex items-center justify-center border font-mono font-black text-xl ${
                    prediction.risk_score_percent >= 65 ? 'bg-[#fa7faa]/10 border-[#fa7faa] text-[#fa7faa]' :
                    prediction.risk_score_percent >= 30 ? 'bg-amber-500/10 border-amber-400 text-amber-400' :
                    'bg-[#c2ef4e]/10 border-[#c2ef4e] text-[#c2ef4e]'
                  }`}>
                    {prediction.risk_score_percent}%
                  </div>
                  <div>
                    <div className="text-[10px] font-mono text-[#bdb8c0] uppercase">Вердикт ML-модели:</div>
                    <div className={`text-sm font-bold font-mono ${
                      prediction.risk_score_percent >= 65 ? 'text-[#fa7faa]' :
                      prediction.risk_score_percent >= 30 ? 'text-amber-400' :
                      'text-[#c2ef4e]'
                    }`}>
                      {prediction.anomaly_level === 'HIGH_RISK_FRAUD' ? 'ВЫСОКИЙ РИСК ФРОДА (БЛОКИРОВКА)' :
                       prediction.anomaly_level === 'SUSPICIOUS' ? 'ПОДОЗРИТЕЛЬНАЯ ОПЕРАЦИЯ' : 'ЛЕГИТИМНАЯ УСЛУГА'}
                    </div>
                  </div>
                </div>

                {/* Feature breakdown list */}
                <div className="text-xs font-mono space-y-1 text-[#bdb8c0]">
                  <div>• Скорость оказания (Velocity): <b className="text-white">{prediction.feature_breakdown.velocity_factor}%</b></div>
                  <div>• Задержка загрузки реестра: <b className="text-amber-400">{prediction.feature_breakdown.upload_delay_factor}%</b></div>
                  <div>• Отклонение стоимости от средней: <b className="text-[#fa7faa]">{prediction.feature_breakdown.cost_deviation_factor}%</b></div>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[#362d59] bg-[#150f23] flex items-center justify-between">
          <span className="text-[11px] text-[#bdb8c0] font-mono">
            ДЭР по области Абай АФМ РК • AI/ML AntiFraud Engine
          </span>
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#3f3849] hover:bg-[#422082] text-white text-xs font-mono font-bold uppercase tracking-wider transition-all border border-[#362d59]"
          >
            Закрыть
          </button>
        </div>

      </div>
    </div>
  );
}
