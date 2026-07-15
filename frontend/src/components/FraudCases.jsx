import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  AlertTriangle, 
  Download, 
  User, 
  Building2, 
  Stethoscope, 
  Calendar,
  Globe,
  MapPin,
  Clock,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

export default function FraudCases() {
  const { cases, selectedCase, setSelectedCase } = useApp();

  const getBreadcrumbIcon = (iconName) => {
    switch (iconName) {
      case 'User': return <User size={14} className="text-blue-400" />;
      case 'Activity': return <Stethoscope size={14} className="text-sentry-lime" />;
      case 'MapPin': return <MapPin size={14} className="text-pink-400" />;
      case 'Calendar': return <Calendar size={14} className="text-yellow-400" />;
      case 'Globe': return <Globe size={14} className="text-teal-400" />;
      default: return <Clock size={14} className="text-gray-400" />;
    }
  };

  const getSeverityBadge = (status) => {
    if (status === 'BLOCKED') {
      return (
        <span className="bg-risk-blocked/15 text-risk-blocked border border-risk-blocked/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono">
          Критический (Block)
        </span>
      );
    }
    return (
      <span className="bg-risk-suspicion/15 text-risk-suspicion border border-risk-suspicion/30 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider font-mono">
        Средний (Suspicion)
      </span>
    );
  };

  const exportMaterials = (item) => {
    if (!item) return;

    const reportContent = `
======================================================================
     ДЕПАРТАМЕНТ ЭКОНОМИЧЕСКИХ РАССЛЕДОВАНИЙ РК (ДЭР)
     МАТЕРИАЛЫ ДЛЯ УГОЛОВНОГО РАССЛЕДОВАНИЯ № ${item.transaction_id.substring(0, 8).toUpperCase()}
======================================================================

1. ОБЩИЕ СВЕДЕНИЯ ОБ ИНЦИДЕНТЕ
----------------------------------------------------------------------
ID Транзакции:      ${item.transaction_id}
Время регистрации:  ${item.timestamp}
Статус контроля:    ${item.status === 'BLOCKED' ? 'БЛОКИРОВКА (ФРОД)' : 'ПОДОЗРЕНИЕ НА ДРОБЛЕНИЕ'}
Уровень риска:      ${item.risk_level.toUpperCase()}
Класс правила:      ${item.rules_triggered.map(r => r.category).join(', ')}

2. МЕДИЦИНСКАЯ ОРГАНИЗАЦИЯ (КЛИНИКА)
----------------------------------------------------------------------
Название клиники:   ${item.clinic?.name || 'Неизвестно'}
ID клиники:         ${item.clinic?.id || 'Неизвестно'}
Регион/Филиал:      ${item.clinic?.region || 'Неизвестно'}

3. ДАННЫЕ О ПАЦИЕНТЕ
----------------------------------------------------------------------
Имя пациента:       ${item.patient?.name || 'Неизвестно'}
ИИН пациента:       ${item.patient?.iin || 'Неизвестно'}
Пол:                ${item.patient?.gender === 'M' ? 'Мужской' : 'Женский'}
Гражданский статус: ${item.patient?.status || 'ACTIVE'}

4. ДАННЫЕ О МЕДИЦИНСКОМ РАБОТНИКЕ (ВРАЧ)
----------------------------------------------------------------------
Имя врача:          ${item.doctor?.name || 'Неизвестно'}
ИИН врача:          ${item.doctor?.iin || 'Неизвестно'}
Специализация:      ${item.doctor?.specialty || 'Неизвестно'}
В отпуске:          ${item.doctor?.is_on_leave ? 'Да (Ghost Doctor Anomaly)' : 'Нет'}

5. ПРЕДОСТАВЛЕННАЯ УСЛУГА
----------------------------------------------------------------------
Код услуги:         ${item.service?.code || 'Неизвестно'}
Наименование:       ${item.service?.name || 'Неизвестно'}
Категория услуги:   ${item.service?.category || 'Неизвестно'}
Длительность:       ${item.service?.duration_minutes || 0} минут
Стоимость:          ${item.service?.cost || 0} Тенге

6. ХРОНОЛОГИЧЕСКИЙ ЛОГ ДЕЙСТВИЙ (BREADCRUMBS)
----------------------------------------------------------------------
${item.breadcrumbs.map((b, idx) => `[${b.timestamp}] (${b.icon}) ${b.message}`).join('\n')}

7. СРАБОТАВШИЕ ПРАВИЛА MIDDLEWARE
----------------------------------------------------------------------
${item.rules_triggered.map((r, idx) => `
* Правило: ${r.rule_id} (${r.category})
  Детали: ${r.message}
  Дополнительные метрики: ${JSON.stringify(r.details)}
`).join('\n')}

8. РЕКОМЕНДАЦИЯ АНАЛИТИКА ДЭР
----------------------------------------------------------------------
На основании выявленных нарушений ФСМС, рекомендуется:
[ ] Инициировать внеплановую проверку клиники ${item.clinic?.name}.
[ ] Направить официальный запрос в Погранслужбу КНБ РК.
[ ] Передать материалы в территориальное подразделение ДЭР.

Документ сформирован автоматически ИИС "AntiFraud-DER".
Дата выгрузки: ${new Date().toISOString()}
======================================================================
`;

    const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DER_Incident_Report_${item.transaction_id.substring(0, 8)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full bg-bgDark">
      {/* Left Pane - List of incidents */}
      <div className="w-1/3 border-r border-borderGrey flex flex-col bg-bgDark min-w-[320px]">
        <div className="p-4 border-b border-borderGrey bg-bgCard">
          <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-400">Список инцидентов ДЭР</h2>
          <p className="text-[10px] text-gray-500">Автоматически заблокированные транзакции и подозрения</p>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-borderGrey">
          {cases.length === 0 ? (
            <div className="p-6 text-center text-gray-500 font-mono text-xs">
              Нарушений не обнаружено.
            </div>
          ) : (
            cases.map((item) => (
              <div
                key={item.transaction_id}
                onClick={() => setSelectedCase(item)}
                className={`p-4 cursor-pointer transition text-left ${
                  selectedCase?.transaction_id === item.transaction_id 
                    ? 'bg-sentry-violetDeep/20 border-l-4 border-sentry-violet' 
                    : 'hover:bg-zinc-900/40 border-l-4 border-transparent'
                }`}
              >
                <div className="flex justify-between items-start gap-2 mb-1.5">
                  <span className="font-mono text-xs text-sentry-pink font-semibold">
                    {item.transaction_id.substring(0, 8)}
                  </span>
                  <span className="font-mono text-[10px] text-gray-500">
                    {item.timestamp.substring(11, 19)}
                  </span>
                </div>
                
                <h3 className="font-sans font-medium text-xs text-white truncate">
                  {item.rules_triggered[0]?.rule_id || 'Аномалия'}
                </h3>
                <p className="text-[10px] text-gray-400 font-sans truncate mb-2">
                  Пациент: {item.patient?.name}
                </p>

                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-500 font-mono truncate max-w-[120px]">
                    {item.clinic?.name}
                  </span>
                  {getSeverityBadge(item.status)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Right Pane - Case Details & Breadcrumbs */}
      <div className="flex-1 flex flex-col bg-[#141417] overflow-y-auto">
        {selectedCase ? (
          <div className="p-6 space-y-6">
            
            {/* Header section with Export Button */}
            <div className="flex flex-wrap justify-between items-start border-b border-borderGrey pb-4 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-risk-blocked/10 text-risk-blocked border border-risk-blocked/20 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider font-mono">
                    {selectedCase.risk_level.toUpperCase()} RISK
                  </span>
                  <span className="font-mono text-xs text-gray-500">
                    ID: {selectedCase.transaction_id}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white font-mono flex items-center gap-2">
                  <ShieldAlert className="text-risk-blocked" size={20} />
                  {selectedCase.rules_triggered[0]?.rule_id}
                </h2>
                <p className="text-xs text-gray-400 mt-1">
                  Обнаружено: {selectedCase.timestamp} в {selectedCase.clinic?.name} ({selectedCase.clinic?.region})
                </p>
              </div>

              <button
                onClick={() => exportMaterials(selectedCase)}
                className="flex items-center gap-2 bg-sentry-violet hover:bg-sentry-violet/90 text-white font-mono uppercase tracking-wider text-xs px-4 py-2.5 rounded transition shadow-md"
              >
                <Download size={14} />
                Выгрузить материалы для расследования
              </button>
            </div>

            {/* Rule Trigger Message */}
            <div className="bg-bgCard border border-borderGrey p-4 rounded-xl space-y-2">
              <h3 className="text-xs uppercase font-mono font-bold tracking-wider text-gray-400">Описание нарушения</h3>
              <p className="text-sm font-sans text-white">
                {selectedCase.rules_triggered[0]?.message}
              </p>
            </div>

            {/* Grid of metadata: Patient & Doctor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Patient info */}
              <div className="bg-bgCard border border-borderGrey rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-borderGrey pb-2">
                  <User size={14} className="text-sentry-violet" />
                  Информация о пациенте
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div className="text-gray-500 font-sans">ФИО:</div>
                  <div className="text-white font-sans font-medium">{selectedCase.patient?.name}</div>
                  <div className="text-gray-500 font-sans">ИИН:</div>
                  <div className="text-white font-mono">{selectedCase.patient?.iin}</div>
                  <div className="text-gray-500 font-sans">Пол:</div>
                  <div className="text-white font-sans">{selectedCase.patient?.gender === 'M' ? 'Мужской' : 'Женский'}</div>
                  <div className="text-gray-500 font-sans">Статус загса:</div>
                  <div className={`font-mono font-bold ${selectedCase.patient?.status === 'DECEASED' ? 'text-risk-blocked' : 'text-risk-approved'}`}>
                    {selectedCase.patient?.status}
                  </div>
                </div>
              </div>

              {/* Doctor & Service Info */}
              <div className="bg-bgCard border border-borderGrey rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2 border-b border-borderGrey pb-2">
                  <Stethoscope size={14} className="text-sentry-pink" />
                  Врач и услуга
                </h3>
                <div className="grid grid-cols-2 gap-y-2 text-xs">
                  <div className="text-gray-500 font-sans">ФИО врача:</div>
                  <div className="text-white font-sans font-medium">{selectedCase.doctor?.name}</div>
                  <div className="text-gray-500 font-sans">Специальность:</div>
                  <div className="text-white font-sans">{selectedCase.doctor?.specialty}</div>
                  <div className="text-gray-500 font-sans">Услуга:</div>
                  <div className="text-white font-sans truncate">{selectedCase.service?.name}</div>
                  <div className="text-gray-500 font-sans">Стоимость:</div>
                  <div className="text-sentry-lime font-mono font-bold">
                    {new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(selectedCase.service?.cost || 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sentry-Style Breadcrumbs Timeline */}
            <div className="bg-bgCard border border-borderGrey rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">Хронологический лог событий (Breadcrumbs)</h3>
                <p className="text-[10px] text-gray-500">Воссоздание последовательности действий для выявления аномалии</p>
              </div>

              <div className="relative border-l border-borderGrey ml-3 pl-6 space-y-6 py-2">
                {selectedCase.breadcrumbs.map((breadcrumb, idx) => (
                  <div key={idx} className="relative">
                    {/* Circle icon marker on the timeline */}
                    <div className="absolute -left-[35px] top-0.5 bg-[#15151c] border border-borderGrey rounded-full p-1 z-10">
                      {getBreadcrumbIcon(breadcrumb.icon)}
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-gray-500 bg-black/35 px-1.5 py-0.5 rounded">
                          {breadcrumb.timestamp}
                        </span>
                        <span className="text-[9px] uppercase font-mono tracking-wider text-gray-500">
                          {breadcrumb.type}
                        </span>
                      </div>
                      <p className={`text-xs font-sans ${
                        breadcrumb.type === 'error' ? 'text-risk-blocked font-semibold' : 'text-gray-300'
                      }`}>
                        {breadcrumb.message}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Investigation recommendation */}
            <div className="bg-sentry-violetDeep/10 border border-sentry-violet/30 rounded-xl p-4 flex gap-4 items-start">
              <div className="p-2 bg-sentry-violet/20 rounded-lg text-sentry-violet">
                <ShieldAlert size={20} />
              </div>
              <div className="space-y-1">
                <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-gray-200">Рекомендация ДЭР РК по расследованию</h4>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  {selectedCase.status === 'BLOCKED' 
                    ? "Инициируйте уголовное расследование по факту приписок услуг (Статья 190 УК РК - Мошенничество). Выгрузите материалы и сверьте данные с оригиналом электронной медицинской карты пациента в системе Damumed."
                    : "Направьте официальное предписание в ФСМС для приостановки выплат клинике по указанным транзакциям до выяснения обстоятельств возможного дробления ( splitting ) финансовых лимитов."
                  }
                </p>
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-600 font-mono text-xs">
            <AlertTriangle size={32} className="mb-2 text-gray-700" />
            Выберите случай из списка для проведения расследования
          </div>
        )}
      </div>
    </div>
  );
}
