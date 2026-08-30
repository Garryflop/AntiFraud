import React, { useState, useEffect } from 'react';
import { ShieldAlert, FileText, CheckCircle2, XCircle, Clock, AlertTriangle, X, Send, Gavel } from 'lucide-react';

export default function DisputesRegistryModal({ isOpen, onClose }) {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [auditorComment, setAuditorComment] = useState('');
  const [actionMessage, setActionMessage] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchDisputes();
    }
  }, [isOpen]);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/disputes');
      if (res.ok) {
        const data = await res.json();
        setDisputes(data);
      }
    } catch (e) {
      console.error("Failed to fetch disputes:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (disputeId, action) => {
    try {
      const res = await fetch(`http://localhost:8000/api/v1/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: action,
          auditor_comment: auditorComment
        })
      });
      if (res.ok) {
        const updated = await res.json();
        setActionMessage(action === 'APPROVE' 
          ? `✓ ОБОСНОВАНИЕ ПРИНЯТО: ФСМС санкционировал перевод ${updated.amount_kzt.toLocaleString()} ₸`
          : `✕ ШТРАФНЫЕ САНКЦИИ ПРИМЕНЕНЫ: Наложен штраф 200% (${updated.penalty_amount_kzt.toLocaleString()} ₸)`
        );
        fetchDisputes();
        setTimeout(() => setActionMessage(null), 5000);
      }
    } catch (e) {
      console.error("Failed to resolve dispute:", e);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#150f23]/85 backdrop-blur-md p-4 animate-fade-in">
      {/* Modal Shell per DESIGN.md: Dark canvas #1f1633, Hairline #362d59, rounded-xl */}
      <div className="bg-[#1f1633] border border-[#362d59] w-full max-w-5xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header Bar per DESIGN.md */}
        <div className="px-6 py-4 border-b border-[#362d59] bg-[#150f23] flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-md bg-[#422082] border border-[#6a5fc1]/40 flex items-center justify-center text-[#c2ef4e]">
              <Gavel size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm uppercase tracking-wider font-sans">
                  РЕЕСТР ПРЕТЕНЗИЙ И ОБОСНОВАНИЙ ФСМС
                </span>
                <span className="bg-[#c2ef4e] text-[#1f1633] text-[10px] font-mono font-bold px-2 py-0.5 rounded-[4px] uppercase">
                  РЕГЛАМЕНТ 72Ч
                </span>
              </div>
              <p className="text-[11px] text-[#bdb8c0] font-mono mt-0.5">
                Автоматическое уведомление медорганизаций • Департамент экономических расследований по области Абай
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

        {/* Action Banner Alert */}
        {actionMessage && (
          <div className="bg-[#422082]/60 border-b border-[#c2ef4e]/40 px-6 py-2.5 text-[#c2ef4e] text-xs font-mono font-bold flex items-center justify-between animate-pulse">
            <span className="flex items-center gap-2">
              <CheckCircle2 size={14} />
              {actionMessage}
            </span>
            <button onClick={() => setActionMessage(null)} className="text-white hover:underline text-[11px]">Закрыть</button>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-4 font-sans text-xs custom-scrollbar flex-1">

          {/* Workflow Banner Box per DESIGN.md: Dark midnight card with hairline */}
          <div className="p-4 rounded-md bg-[#150f23] border border-[#362d59] flex items-start space-x-3 text-xs">
            <div className="p-1.5 rounded bg-[#422082] text-[#c2ef4e] shrink-0 mt-0.5">
              <ShieldAlert size={16} />
            </div>
            <div className="space-y-1">
              <span className="font-bold text-white text-xs uppercase tracking-wider font-mono flex items-center gap-2">
                <span>ПОРЯДОК РАССМОТРЕНИЯ ПРИПИСОК И АНОМАЛИЙ</span>
              </span>
              <p className="text-[#bdb8c0] leading-relaxed text-[11px]">
                При блокировке подозрительной услуги клинике высылается автоматический запрос на E-mail. В течение <strong className="text-[#c2ef4e]">72 часов</strong> медорганизация обязана предоставить врачебное обоснование и сканы медкарт. В случае удовлетворения обоснования — <strong className="text-emerald-400">ФСМС выплачивает деньги</strong>. При непредоставлении или отказе аудитора — <strong className="text-[#fa7faa]">применяется 200% штрафное взыскание</strong>.
              </p>
            </div>
          </div>

          {/* Disputes Item List */}
          {loading ? (
            <div className="text-center py-12 text-[#bdb8c0] font-mono animate-pulse">
              [ ИНИЦИАЛИЗАЦИЯ РЕЕСТРА ОБОСНОВАНИЙ... ]
            </div>
          ) : disputes.length === 0 ? (
            <div className="text-center py-12 text-[#bdb8c0] font-mono">
              [ НЕТ АКТИВНЫХ ДИСПУТОВ И ПРЕТЕНЗИЙ ]
            </div>
          ) : (
            <div className="space-y-3">
              {disputes.map((disp) => {
                const isPending = disp.status === 'PENDING_JUSTIFICATION';
                const isSubmitted = disp.status === 'JUSTIFICATION_SUBMITTED';
                const isPaid = disp.status === 'APPROVED_PAID';
                const isSanctioned = disp.status === 'REJECTED_SANCTIONED';

                return (
                  <div 
                    key={disp.id} 
                    className={`p-4 rounded-md border transition-all ${
                      isPending ? 'bg-[#150f23] border-amber-500/40' :
                      isSubmitted ? 'bg-[#1f1633] border-[#6a5fc1]' :
                      isPaid ? 'bg-[#12221b] border-emerald-500/40' :
                      'bg-[#23151b] border-[#fa7faa]/40'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-[#362d59] text-white">
                            {disp.id}
                          </span>
                          <span className="text-xs font-bold text-white">{disp.clinic_name}</span>
                          <span className="text-[10px] font-mono text-[#79628c]">({disp.clinic_email})</span>
                        </div>

                        <div className="text-xs text-[#bdb8c0]">
                          Услуга: <span className="text-white font-medium">{disp.service_name}</span> ({disp.service_code}) — <span className="text-[#c2ef4e] font-mono font-bold">{disp.amount_kzt.toLocaleString()} ₸</span>
                        </div>

                        <div className="text-xs text-[#fa7faa] flex items-center space-x-2 font-mono">
                          <AlertTriangle size={12} className="shrink-0" />
                          <span>Причина: {disp.rejection_reason}</span>
                          <span className="px-1.5 py-0.2 rounded bg-[#fa7faa]/10 border border-[#fa7faa]/30 text-[10px] font-bold">
                            ML Risk: {disp.ml_risk_score}%
                          </span>
                        </div>
                      </div>

                      {/* Status Badges & Buttons */}
                      <div className="flex flex-col items-end space-y-2 shrink-0">
                        {isPending && (
                          <div className="flex items-center space-x-2 font-mono">
                            <span className="text-[11px] text-amber-400 font-bold px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/30 flex items-center gap-1.5 animate-pulse">
                              <Clock size={12} />
                              ОЖИДАНИЕ КЛИНИКИ (72Ч)
                            </span>
                          </div>
                        )}

                        {isSubmitted && (
                          <span className="text-[11px] text-[#c2ef4e] font-mono font-bold px-2.5 py-1 rounded bg-[#422082] border border-[#6a5fc1] flex items-center gap-1.5">
                            <FileText size={12} />
                            ОБОСНОВАНИЕ ПОСТУПИЛО
                          </span>
                        )}

                        {isPaid && (
                          <span className="text-[11px] text-emerald-400 font-mono font-bold px-2.5 py-1 rounded bg-emerald-950/60 border border-emerald-500/40 flex items-center gap-1.5">
                            <CheckCircle2 size={12} />
                            ОДОБРЕНО (ФОНД ВЫПЛАТИЛ)
                          </span>
                        )}

                        {isSanctioned && (
                          <span className="text-[11px] text-[#fa7faa] font-mono font-bold px-2.5 py-1 rounded bg-[#fa7faa]/10 border border-[#fa7faa]/40 flex items-center gap-1.5">
                            <XCircle size={12} />
                            ШТРАФ ({disp.penalty_amount_kzt.toLocaleString()} ₸)
                          </span>
                        )}

                        {/* Audit Action Buttons per DESIGN.md button-primary & button-inverted */}
                        {(isPending || isSubmitted) && (
                          <div className="flex items-center space-x-2 pt-1 font-mono">
                            <button
                              onClick={() => handleResolve(disp.id, 'APPROVE')}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white uppercase tracking-wider transition-all shadow-md"
                            >
                              Одобрить (Выплатить)
                            </button>
                            <button
                              onClick={() => handleResolve(disp.id, 'REJECT')}
                              className="px-3 py-1.5 text-[11px] font-bold rounded-md bg-[#fa7faa] hover:bg-[#fa7faa]/80 text-[#1f1633] uppercase tracking-wider transition-all shadow-md"
                            >
                              Штрафные санкции (200%)
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Submitted text preview */}
                    {disp.justification_text && (
                      <div className="mt-3 p-3 rounded-md bg-[#150f23] border border-[#362d59] text-xs text-[#bdb8c0]">
                        <span className="font-bold text-[#c2ef4e] font-mono block mb-1 uppercase tracking-wider text-[10px]">
                          [ ВРАЧЕБНОЕ ОБОСНОВАНИЕ КЛИНИКИ ]
                        </span>
                        "{disp.justification_text}"
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Modal Footer per DESIGN.md */}
        <div className="px-6 py-4 border-t border-[#362d59] bg-[#150f23] flex items-center justify-between">
          <span className="text-[11px] text-[#bdb8c0] font-mono">
            ДЭР по области Абай АФМ РК • Подсистема досудебного регулирования ФСМС
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
