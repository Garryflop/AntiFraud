import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Filter, 
  Zap, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  AlertTriangle,
  Building,
  Shield,
  HelpCircle,
  FileCode
} from 'lucide-react';

export default function LiveMonitor() {
  const { 
    transactions = [], 
    totalTransactions = 0, 
    loading = false, 
    statusFilter, 
    setStatusFilter, 
    searchQuery, 
    setSearchQuery, 
    page = 1, 
    setPage,
    pageSize = 20,
    generateSimulationLogs,
    resetSimulation
  } = useApp();

  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getStatusClass = (status) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-risk-approved/10 text-risk-approved border border-risk-approved/20';
      case 'SUSPICION':
        return 'bg-risk-suspicion/10 text-risk-suspicion border border-risk-suspicion/20';
      case 'BLOCKED':
        return 'bg-risk-blocked/10 text-risk-blocked border border-risk-blocked/20';
      default:
        return 'bg-gray-500/10 text-gray-400 border border-gray-500/20';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'APPROVED': return 'Одобрено';
      case 'SUSPICION': return 'Подозрение';
      case 'BLOCKED': return 'Фрод Блок';
      default: return status;
    }
  };

  const formatCost = (cost) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(cost);
  };

  return (
    <div className="flex flex-col h-full bg-bgDark">
      {/* Simulation & Control Header */}
      <div className="p-4 border-b border-borderGrey flex flex-wrap justify-between items-center bg-bgCard gap-4">
        <div>
          <h2 className="text-lg font-bold flex items-center gap-2">
            Монитор транзакций
            <span className="font-mono text-xs bg-sentry-violet-deep text-white px-2 py-0.5 rounded border border-sentry-violet/40">LIVE</span>
          </h2>
          <p className="text-xs text-gray-400">Входящий поток реестра медицинских услуг ФСМС</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => generateSimulationLogs(100)}
            disabled={loading}
            className="flex items-center gap-1.5 bg-sentry-violet hover:bg-sentry-violet/80 text-white font-mono uppercase tracking-wider text-xs px-3 py-2 rounded transition"
          >
            <Zap size={14} />
            +100 транзакций
          </button>
          
          <button
            onClick={resetSimulation}
            disabled={loading}
            className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-gray-300 border border-borderGrey font-mono uppercase tracking-wider text-xs px-3 py-2 rounded transition"
          >
            <RotateCcw size={14} />
            Сбросить БД
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-borderGrey flex flex-wrap items-center justify-between gap-4 bg-bgDark">
        {/* Status Filters */}
        <div className="flex bg-bgCard border border-borderGrey rounded p-0.5">
          {['ALL', 'APPROVED', 'SUSPICION', 'BLOCKED'].map((status) => (
            <button
              key={status}
              onClick={() => { setStatusFilter(status); setPage(1); }}
              className={`px-3 py-1 text-xs rounded transition font-mono ${
                statusFilter === status 
                  ? 'bg-zinc-800 text-white border border-borderGrey font-bold' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {status === 'ALL' ? 'Все' : getStatusLabel(status)}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">
            <Search size={14} />
          </span>
          <input
            type="text"
            placeholder="Поиск по ИИН пациента/врача, клинике..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
            className="w-full bg-bgCard border border-borderGrey rounded pl-9 pr-4 py-1.5 text-xs text-white focus:outline-none focus:border-sentry-violet transition placeholder:text-gray-600"
          />
        </div>
      </div>

      {/* Main Table Panel */}
      <div className="flex-1 overflow-auto min-h-0">
        {loading && (!transactions || transactions.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-2">
            <RotateCcw className="animate-spin text-sentry-violet" size={32} />
            <span className="font-mono text-xs">Загрузка логов...</span>
          </div>
        ) : (!transactions || transactions.length === 0) ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 space-y-1">
            <AlertTriangle size={32} className="text-risk-suspicion" />
            <span className="font-mono text-xs mt-2">Логи не найдены</span>
            <span className="text-xs text-gray-600">Попробуйте изменить фильтр или сгенерировать новые транзакции.</span>
          </div>
        ) : (
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-bgCard border-b border-borderGrey text-gray-400 font-mono text-[10px] uppercase tracking-wider">
                <th className="p-3 w-8"></th>
                <th className="p-3">ID Транзакции</th>
                <th className="p-3">Время</th>
                <th className="p-3">Пациент (ИИН)</th>
                <th className="p-3">Врач (Специализация)</th>
                <th className="p-3">Клиника</th>
                <th className="p-3">Услуга</th>
                <th className="p-3 text-right">Стоимость</th>
                <th className="p-3 text-center">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borderGrey text-xs font-mono">
              {transactions.map((tx) => {
                if (!tx) return null;
                try {
                  const isExpanded = !!expandedRows[tx.id];
                  return (
                    <React.Fragment key={tx.id}>
                      {/* Primary Row */}
                      <tr 
                        onClick={() => toggleRow(tx.id)}
                        className={`hover:bg-zinc-900/50 cursor-pointer transition ${isExpanded ? 'bg-zinc-900/40' : ''}`}
                      >
                        <td className="p-3 text-center text-gray-500">
                          {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </td>
                        <td className="p-3 text-sentry-pink font-semibold">
                          {tx.id ? tx.id.substring(0, 8) : 'unknown'}...
                        </td>
                        <td className="p-3 text-gray-400 whitespace-nowrap">
                          {tx.payload?.timestamp ? tx.payload.timestamp.substring(11, 19) : ''}
                          <span className="text-[10px] text-gray-600 block">
                            {tx.payload?.timestamp ? tx.payload.timestamp.substring(0, 10) : ''}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className="text-white block font-sans font-medium">{tx.patient?.name || 'Неизвестный'}</span>
                          <span className="text-[10px] text-gray-400">{tx.payload?.patient_iin}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-gray-300 block font-sans">{tx.doctor?.name || 'Неизвестный'}</span>
                          <span className="text-[10px] text-sentry-violet font-semibold uppercase">{tx.doctor?.specialty}</span>
                        </td>
                        <td className="p-3 font-sans">
                          <span className="text-gray-300 block">{tx.clinic?.name || 'Неизвестная'}</span>
                          <span className="text-[10px] font-mono text-gray-500">{tx.clinic?.region}</span>
                        </td>
                        <td className="p-3">
                          <span className="text-white block font-sans max-w-[180px] truncate">{tx.service?.name}</span>
                          <span className="text-[10px] text-gray-500">{tx.service?.category} ({tx.service?.duration_minutes} мин)</span>
                        </td>
                        <td className="p-3 text-right text-white font-bold">
                          {formatCost(tx.service?.cost || 0)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider whitespace-nowrap ${getStatusClass(tx.status)}`}>
                            {getStatusLabel(tx.status)}
                          </span>
                        </td>
                      </tr>
                      
                      {/* Expandable JSON details row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan="9" className="bg-[#15151c] p-4 border-l-2 border-sentry-violet">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              
                              {/* Rules Triggered Sub-panel */}
                              <div className="space-y-3">
                                <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                                  <Shield size={14} className="text-sentry-violet" />
                                  Результат проверки Middleware
                                </h4>
                                
                                {(!tx.rules_triggered || tx.rules_triggered.length === 0) ? (
                                  <div className="bg-risk-approved/5 border border-risk-approved/20 rounded p-3 text-risk-approved text-xs">
                                    Аномалий не выявлено. Транзакция автоматически одобрена ФСМС.
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    {tx.rules_triggered.map((rule, idx) => (
                                      <div key={idx} className={`p-3 rounded border text-xs space-y-1 ${
                                        rule.severity === 'BLOCKED' 
                                          ? 'bg-risk-blocked/5 border-risk-blocked/30 text-risk-blocked'
                                          : 'bg-risk-suspicion/5 border-risk-suspicion/30 text-risk-suspicion'
                                      }`}>
                                        <div className="font-bold flex justify-between">
                                          <span>[{rule.category}] {rule.rule_id}</span>
                                          <span className="uppercase text-[9px] font-mono px-1 rounded bg-black/40">
                                            {rule.severity}
                                          </span>
                                        </div>
                                        <p className="text-gray-300 font-sans">{rule.message}</p>
                                        {rule.details && Object.keys(rule.details).length > 0 && (
                                          <div className="bg-black/25 p-2 rounded mt-2 text-[10px] text-gray-400 overflow-x-auto">
                                            <span className="font-bold block text-gray-500 mb-1">Метрики телеметрии:</span>
                                            {JSON.stringify(rule.details, null, 2)}
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              {/* JSON Payload viewer */}
                              <div className="space-y-3">
                                <h4 className="text-xs uppercase font-bold tracking-wider text-gray-400 flex items-center gap-1">
                                  <FileCode size={14} className="text-sentry-pink" />
                                  Сырой Payload транзакции
                                </h4>
                                <pre className="bg-black/40 border border-borderGrey p-3 rounded text-[10px] text-gray-400 overflow-x-auto max-h-60 leading-relaxed scrollbar-thin">
                                  {JSON.stringify(tx, null, 2)}
                                </pre>
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                } catch (err) {
                  console.error("Error rendering transaction row:", tx, err);
                  return (
                    <tr key={tx?.id || Math.random().toString()} className="bg-red-950/20 text-red-400">
                      <td colSpan="9" className="p-3 font-mono text-xs text-center border border-red-500/20">
                        Ошибка рендеринга транзакции {tx?.id || 'unknown'}: {err.message}
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="p-3 border-t border-borderGrey bg-bgCard flex items-center justify-between text-xs text-gray-400 font-mono">
        <div>
          Всего логов в сессии: <span className="text-white font-bold">{totalTransactions}</span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-2 py-1 rounded bg-zinc-800 border border-borderGrey disabled:opacity-40 hover:bg-zinc-700 transition"
          >
            Назад
          </button>
          <span>Страница {page}</span>
          <button
            disabled={!transactions || transactions.length < pageSize}
            onClick={() => setPage(p => p + 1)}
            className="px-2 py-1 rounded bg-zinc-800 border border-borderGrey disabled:opacity-40 hover:bg-zinc-700 transition"
          >
            Вперед
          </button>
        </div>
      </div>
    </div>
  );
}
