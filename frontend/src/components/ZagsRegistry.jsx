import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  Search,
  User,
  UserX,
  UserCheck,
  ShieldAlert,
  AlertOctagon,
  CheckCircle,
  Database,
  Calendar,
  MapPin,
  FileText,
  Building2,
  Activity,
  ArrowRight,
  RefreshCw,
  Clock,
  Filter,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function ZagsRegistry() {
  const { API_BASE_URL } = useApp();

  // Search State
  const [searchIin, setSearchIin] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Table Database State
  const [citizens, setCitizens] = useState([]);
  const [loadingTable, setLoadingTable] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, ACTIVE, DECEASED
  const [tableSearch, setTableSearch] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    deceased: 0
  });

  // Presets for quick click testing
  const presets = [
    { iin: '800512300456', name: 'Карабаев Ербол (Умер)', status: 'DECEASED' },
    { iin: '750824400789', name: 'Смаилова Бахыт (Умерла)', status: 'DECEASED' },
    { iin: '881205300123', name: 'Жумабаев Марат (Умер)', status: 'DECEASED' },
    { iin: '900101300123', name: 'Ахметов Нурсултан (Жив)', status: 'ACTIVE' }
  ];

  // Fetch Citizens List for Table
  const fetchCitizens = async () => {
    setLoadingTable(true);
    try {
      const url = new URL(`${API_BASE_URL}/api/zags/citizens`);
      url.searchParams.append('status', statusFilter);
      if (tableSearch.trim()) {
        url.searchParams.append('search', tableSearch.trim());
      }
      url.searchParams.append('page_size', '100');

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCitizens(data.items || []);
        setStats({
          total: data.total_citizens || data.total || 0,
          active: data.active_count || 0,
          deceased: data.deceased_count || 0
        });
      }
    } catch (err) {
      console.error('Error fetching ZAGS citizens:', err);
    } finally {
      setLoadingTable(false);
    }
  };

  useEffect(() => {
    fetchCitizens();
  }, [statusFilter, tableSearch]);

  // Handle Lookup by IIN
  const handleCheckIin = async (targetIin = searchIin) => {
    const clean = targetIin.replace(/\D/g, '');
    if (clean.length !== 12) {
      setErrorMsg('ИИН должен состоять ровно из 12 цифр');
      return;
    }

    setErrorMsg('');
    setChecking(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/zags/check/${clean}`);
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
        setSearchIin(clean);
      } else {
        setErrorMsg('Ошибка при обращении к реестру ЗАГС');
      }
    } catch (err) {
      console.error('Error checking IIN:', err);
      setErrorMsg('Не удалось связаться с сервером базы ЗАГС');
    } finally {
      setChecking(false);
    }
  };

  const handlePresetClick = (iin) => {
    setSearchIin(iin);
    handleCheckIin(iin);
  };

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-gray-200">
      
      {/* Header Banner */}
      <div className="bg-[#150f23] border border-borderGrey rounded-lg p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-3">
            <div className="bg-[#241645] border border-purple-500/30 p-2.5 rounded-lg text-purple-400">
              <Database size={22} />
            </div>
            <div>
              <span className="text-xs font-mono text-sentry-lime font-bold tracking-widest uppercase block">
                ГОСУДАРСТВЕННАЯ БАЗА ДАННЫХ ФИЗИЧЕСКИХ ЛИЦ
              </span>
              <h1 className="text-xl font-bold text-white tracking-wide uppercase">
                РЕЕСТР ЗАГС / ИИС РАГС • СВЕРКА С ТРАНЗАКЦИЯМИ ФСМС
              </h1>
            </div>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed max-w-3xl font-sans">
            Интеграционный сервис верификации статуса граждан по 12-значному ИИН. Служит для немедленной блокировки приписок на лиц, числящихся в реестре как умершие («Мертвые души»).
          </p>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-3 gap-3 shrink-0 z-10 font-mono">
          <div className="bg-[#0b0713]/80 border border-borderGrey p-3.5 rounded-lg text-center min-w-[120px]">
            <span className="text-[10px] text-gray-400 uppercase tracking-wider block mb-1">Всего в базе</span>
            <span className="text-xl font-bold text-white">{stats.total}</span>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-500/30 p-3.5 rounded-lg text-center min-w-[120px]">
            <span className="text-[10px] text-emerald-400/90 uppercase tracking-wider block mb-1">Статус «ЖИВ»</span>
            <span className="text-xl font-bold text-emerald-400">{stats.active}</span>
          </div>

          <div className="bg-red-950/30 border border-red-500/40 p-3.5 rounded-lg text-center min-w-[120px] relative overflow-hidden">
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="text-[10px] text-red-400 uppercase tracking-wider block mb-1">Статус «УМЕР»</span>
            <span className="text-xl font-bold text-red-400">{stats.deceased}</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: SEARCH & PROBING TOOL (12-DIGIT IIN LOOKUP) */}
      <div className="bg-[#150f23] border border-borderGrey rounded-lg p-6 space-y-6 shadow-xl relative">
        <div className="flex items-center justify-between border-b border-borderGrey pb-4">
          <div className="flex items-center gap-2">
            <Search size={18} className="text-sentry-lime" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              СЕРВИС ПРОВЕРКИ И ПРОБИВА ПО 12-ЗНАЧНОМУ ИИН
            </h2>
          </div>
          <span className="text-[11px] font-mono text-gray-400">
            Введите ИИН гражданина для моментального запроса в ГБД ФЛ
          </span>
        </div>

        {/* Input Box & Action */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                maxLength={12}
                value={searchIin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setSearchIin(val);
                  setErrorMsg('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCheckIin();
                }}
                placeholder="Введите 12 цифр ИИН гражданина (напр. 800512300456)..."
                className="w-full bg-[#0b0713] border border-[#382b5c] focus:border-sentry-lime rounded-lg px-4 py-3 text-base font-mono text-white tracking-widest placeholder:text-gray-600 focus:outline-none transition"
              />
              <div className="absolute right-3 top-3.5 text-xs font-mono text-gray-500 pointer-events-none">
                {searchIin.length}/12 цифр
              </div>
            </div>

            <button
              onClick={() => handleCheckIin()}
              disabled={checking || searchIin.length !== 12}
              className={`px-6 py-3 rounded-lg font-mono text-xs uppercase tracking-wider font-bold flex items-center justify-center gap-2 transition shadow-lg ${
                searchIin.length === 12
                  ? 'bg-sentry-lime text-sentry-primary hover:bg-[#d6ff54] cursor-pointer'
                  : 'bg-zinc-800 text-gray-500 cursor-not-allowed border border-zinc-700'
              }`}
            >
              {checking ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Запрос в ЗАГС...</span>
                </>
              ) : (
                <>
                  <Search size={16} />
                  <span>Проверить ИИН в базах ЗАГС</span>
                </>
              )}
            </button>
          </div>

          {errorMsg && (
            <div className="text-xs font-mono text-red-400 bg-red-950/30 border border-red-500/30 px-4 py-2.5 rounded-lg flex items-center gap-2">
              <AlertOctagon size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="flex items-center gap-2 flex-wrap text-xs font-mono pt-1">
            <span className="text-gray-400 font-sans text-xs">Быстрый выбор для демонстрации:</span>
            {presets.map((p) => (
              <button
                key={p.iin}
                onClick={() => handlePresetClick(p.iin)}
                className={`px-3 py-1.5 rounded-md border text-[11px] font-mono transition flex items-center gap-1.5 ${
                  p.status === 'DECEASED'
                    ? 'bg-red-950/30 border-red-500/40 text-red-300 hover:bg-red-900/50'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/50'
                }`}
              >
                {p.status === 'DECEASED' ? <UserX size={12} /> : <UserCheck size={12} />}
                <span>{p.iin} ({p.name})</span>
              </button>
            ))}
          </div>
        </div>

        {/* LOOKUP RESULT DISPLAY CARD */}
        {checkResult && (
          <div className="space-y-6 pt-4 border-t border-borderGrey animate-fadeIn">
            
            {/* Status Alert Banner */}
            <div
              className={`p-6 rounded-lg border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl relative overflow-hidden ${
                checkResult.is_deceased
                  ? 'bg-gradient-to-r from-red-950/80 via-[#260a12] to-red-950/60 border-red-500/60 text-red-200'
                  : 'bg-gradient-to-r from-emerald-950/80 via-[#0a2618] to-emerald-950/60 border-emerald-500/60 text-emerald-200'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`p-3 rounded-lg text-white shrink-0 ${
                    checkResult.is_deceased ? 'bg-red-600 animate-pulse' : 'bg-emerald-600'
                  }`}
                >
                  {checkResult.is_deceased ? <UserX size={28} /> : <UserCheck size={28} />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                        checkResult.is_deceased
                          ? 'bg-red-500 text-white'
                          : 'bg-emerald-500 text-white'
                      }`}
                    >
                      {checkResult.is_deceased ? '[ СМЕРТЬ ЗАРЕГИСТРИРОВАНА ]' : '[ ГРАЖДАНИН АКТИВЕН ]'}
                    </span>
                    <span className="text-xs font-mono text-gray-300">ИИН: {checkResult.patient.iin}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-wide">
                    {checkResult.patient.name}
                  </h3>
                  <p className="text-xs leading-relaxed opacity-95">
                    {checkResult.alert_message}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right font-mono text-xs space-y-1">
                <span className="text-gray-400 block text-[10px] uppercase">Списания в ФСМС</span>
                <div className="flex items-center justify-end gap-2">
                  <span className="text-white font-bold text-base">{checkResult.total_claims_attempted} попыток</span>
                </div>
                {checkResult.blocked_claims_count > 0 && (
                  <span className="text-red-400 font-bold block text-[11px]">
                    Заблокировано: {checkResult.blocked_claims_count}
                  </span>
                )}
              </div>
            </div>

            {/* Citizen Details Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
              <div className="bg-[#0b0713] border border-borderGrey p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">ФИО Гражданина</span>
                <span className="text-white font-bold text-xs truncate block">{checkResult.patient.name}</span>
              </div>

              <div className="bg-[#0b0713] border border-borderGrey p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">12-значный ИИН</span>
                <span className="text-sentry-lime font-bold">{checkResult.patient.iin}</span>
              </div>

              <div className="bg-[#0b0713] border border-borderGrey p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">Биологический Пол</span>
                <span className="text-white font-bold">
                  {checkResult.patient.gender === 'M' ? 'Мужской (M)' : 'Женский (F)'}
                </span>
              </div>

              <div className="bg-[#0b0713] border border-borderGrey p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">Дата рождения</span>
                <span className="text-gray-300">{checkResult.patient.birth_date}</span>
              </div>

              <div className="bg-[#0b0713] border border-borderGrey p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">Дата смерти</span>
                <span className={`font-bold ${checkResult.patient.death_date ? 'text-red-400' : 'text-gray-500'}`}>
                  {checkResult.patient.death_date || '— (Жив)'}
                </span>
              </div>

              <div className="bg-[#0b0713] border border-borderGrey p-3 rounded-lg space-y-1">
                <span className="text-[10px] text-gray-500 uppercase block">Регион прописки</span>
                <span className="text-teal-400 font-bold">{checkResult.patient.region}</span>
              </div>
            </div>

            {/* Claims & Transactions Attempted for this IIN */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-mono uppercase font-bold text-gray-300 flex items-center gap-2">
                  <Activity size={14} className="text-sentry-lime" />
                  <span>ИСТОРИЯ ПОПЫТОК СПИСАНИЯ УСЛУГ В ФСМС ПО ДАННОМУ ИИН ({checkResult.transactions.length})</span>
                </h4>
                {checkResult.is_deceased && checkResult.transactions.length > 0 && (
                  <span className="text-[10px] font-mono text-red-400 bg-red-950/40 border border-red-500/40 px-2 py-0.5 rounded font-bold uppercase">
                    Алерт Антифрода: Все чеки на умершего отсечены
                  </span>
                )}
              </div>

              {checkResult.transactions.length === 0 ? (
                <div className="bg-[#0b0713] border border-borderGrey p-6 rounded-lg text-center text-xs font-mono text-gray-500">
                  Попыток проведения транзакций по ИИН {checkResult.patient.iin} в системе Антифрод не зафиксировано.
                </div>
              ) : (
                <div className="overflow-x-auto border border-borderGrey rounded-lg bg-[#0b0713]">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead className="bg-[#181229] border-b border-borderGrey text-gray-400 text-[10px] uppercase">
                      <tr>
                        <th className="p-3">Дата и Время</th>
                        <th className="p-3">Клиника / Медорганизация</th>
                        <th className="p-3">Услуга ФСМС</th>
                        <th className="p-3 text-right">Сумма (₸)</th>
                        <th className="p-3 text-center">Статус Антифрода</th>
                        <th className="p-3">Причина блокировки / Правило</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderGrey/60 text-gray-300">
                      {checkResult.transactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-zinc-900/60 transition">
                          <td className="p-3 whitespace-nowrap text-gray-400 text-[11px]">{tx.timestamp}</td>
                          <td className="p-3">
                            <div className="font-bold text-white text-[11px]">{tx.clinic_name}</div>
                            <span className="text-[10px] text-gray-500">{tx.clinic_region}</span>
                          </td>
                          <td className="p-3">
                            <div className="text-gray-200 text-[11px]">{tx.service_name}</div>
                            <span className="text-[10px] text-gray-500">{tx.service_category}</span>
                          </td>
                          <td className="p-3 text-right font-bold text-amber-300 text-[11px]">
                            {tx.cost.toLocaleString('ru-RU')} ₸
                          </td>
                          <td className="p-3 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                tx.status === 'BLOCKED'
                                  ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                                  : tx.status === 'SUSPICION'
                                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              }`}
                            >
                              {tx.status === 'BLOCKED' ? 'БЛОКИРОВАН' : tx.status === 'SUSPICION' ? 'ПОДОЗРИТЕЛЬНО' : 'ОДОБРЕНО'}
                            </span>
                          </td>
                          <td className="p-3 text-xs">
                            {tx.rules_triggered && tx.rules_triggered.length > 0 ? (
                              <div className="space-y-1">
                                {tx.rules_triggered.map((r, idx) => (
                                  <div key={idx} className="text-[10px] text-red-300 flex items-start gap-1">
                                    <ShieldAlert size={12} className="shrink-0 text-red-400 mt-0.5" />
                                    <span>{r.message}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-500">— Нарушений не выявлено</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: FAKE DATABASE TABLE (РЕЕСТР ГРАЖДАН ЗАГС) */}
      <div className="bg-[#150f23] border border-borderGrey rounded-lg p-6 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-borderGrey pb-4">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-teal-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
              БАЗА ДАННЫХ ФИЗИЧЕСКИХ ЛИЦ (ЭМУЛЯЦИЯ РЕЕСТРА ГБД ФЛ)
            </h2>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-wrap items-center gap-3 font-mono text-xs">
            {/* Status Filter Tabs */}
            <div className="flex bg-[#0b0713] rounded-lg border border-borderGrey p-0.5 gap-1">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition ${
                  statusFilter === 'ALL'
                    ? 'bg-zinc-800 text-white border border-borderGrey'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Все ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('DECEASED')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition flex items-center gap-1 ${
                  statusFilter === 'DECEASED'
                    ? 'bg-red-950/80 text-red-300 border border-red-500/50'
                    : 'text-gray-400 hover:text-red-400'
                }`}
              >
                <UserX size={12} />
                <span>Умершие ({stats.deceased})</span>
              </button>
              <button
                onClick={() => setStatusFilter('ACTIVE')}
                className={`px-3 py-1.5 rounded-md text-[11px] font-bold uppercase transition flex items-center gap-1 ${
                  statusFilter === 'ACTIVE'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/50'
                    : 'text-gray-400 hover:text-emerald-400'
                }`}
              >
                <UserCheck size={12} />
                <span>Живые ({stats.active})</span>
              </button>
            </div>

            {/* Table Search Input */}
            <div className="relative min-w-[220px]">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-500" />
              <input
                type="text"
                value={tableSearch}
                onChange={(e) => setTableSearch(e.target.value)}
                placeholder="Фильтр по ФИО, ИИН, региону..."
                className="w-full bg-[#0b0713] border border-[#382b5c] focus:border-teal-400 rounded-md pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder:text-gray-600 focus:outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Database Table View */}
        {loadingTable ? (
          <div className="py-12 text-center font-mono text-xs text-gray-400 flex items-center justify-center gap-2">
            <RefreshCw size={16} className="animate-spin text-sentry-lime" />
            <span>Загрузка записей реестра ЗАГС...</span>
          </div>
        ) : citizens.length === 0 ? (
          <div className="py-12 text-center font-mono text-xs text-gray-500 bg-[#0b0713] rounded-lg border border-borderGrey">
            Записей по заданным фильтрам не найдено.
          </div>
        ) : (
          <div className="overflow-x-auto border border-borderGrey rounded-lg bg-[#0b0713]">
            <table className="w-full text-left border-collapse text-xs font-mono">
              <thead className="bg-[#181229] border-b border-borderGrey text-gray-400 text-[10px] uppercase tracking-wider">
                <tr>
                  <th className="p-3">ИИН Гражданина</th>
                  <th className="p-3">ФИО Пациента</th>
                  <th className="p-3">Пол</th>
                  <th className="p-3 text-center">Статус в ЗАГС</th>
                  <th className="p-3">Дата рождения / смерти</th>
                  <th className="p-3">Регион прописки</th>
                  <th className="p-3 text-center">Списаний в ФСМС</th>
                  <th className="p-3 text-right">Действия</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderGrey/60 text-gray-300">
                {citizens.map((citizen) => (
                  <tr
                    key={citizen.iin}
                    className={`hover:bg-zinc-900/60 transition ${
                      citizen.status === 'DECEASED' ? 'bg-red-950/10' : ''
                    }`}
                  >
                    <td className="p-3 font-bold text-sentry-lime whitespace-nowrap">{citizen.iin}</td>
                    <td className="p-3 font-medium text-white">{citizen.name}</td>
                    <td className="p-3">
                      <span className={citizen.gender === 'M' ? 'text-blue-400' : 'text-pink-400'}>
                        {citizen.gender === 'M' ? 'Муж' : 'Жен'}
                      </span>
                    </td>
                    <td className="p-3 text-center whitespace-nowrap">
                      {citizen.status === 'DECEASED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-red-500/20 text-red-400 border border-red-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                          УМЕР (DECEASED)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          ЖИВ (ACTIVE)
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-400 text-[11px]">
                      <div>Рожд: {citizen.birth_date}</div>
                      {citizen.death_date && (
                        <div className="text-red-400 font-bold">Смерть: {citizen.death_date}</div>
                      )}
                    </td>
                    <td className="p-3 text-teal-400">{citizen.region}</td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-0.5 bg-zinc-800 text-gray-300 rounded font-bold text-[11px] border border-borderGrey">
                        {citizen.tx_count}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => {
                          handlePresetClick(citizen.iin);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="px-3 py-1 bg-[#241645] hover:bg-[#392170] text-purple-300 hover:text-white border border-[#483185] rounded text-[11px] font-mono transition inline-flex items-center gap-1"
                      >
                        <Search size={12} />
                        <span>Проверить ИИН</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
