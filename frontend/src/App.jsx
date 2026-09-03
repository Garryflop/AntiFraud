import React from 'react';
import { useApp } from './context/AppContext';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import FraudCases from './components/FraudCases';
import KazakhstanMap from './components/KazakhstanMap';
import { 
  ShieldAlert, 
  Activity, 
  BarChart3, 
  AlertOctagon, 
  CheckCircle,
  HelpCircle,
  Globe,
  Users,
  UserCheck,
  Building2,
  Layers,
  Cpu,
  Code2,
  Server,
  Database,
  FileText
} from 'lucide-react';

import MLAnalyticsModal from './components/MLAnalyticsModal';
import ZagsRegistry from './components/ZagsRegistry';

export default function App() {
  const { activeTab, setActiveTab, stats } = useApp();
  const [isMLOpen, setIsMLOpen] = React.useState(false);

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitor':
        return <LiveMonitor />;
      case 'cases':
        return <FraudCases />;
      case 'map':
        return <KazakhstanMap />;
      case 'zags':
        return <ZagsRegistry />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bgDark overflow-hidden">
      {/* Modals */}
      <MLAnalyticsModal isOpen={isMLOpen} onClose={() => setIsMLOpen(false)} />

      {/* Sentry-Style Top Navigation Bar */}
      <header className="bg-[#150f23] border-b border-borderGrey px-6 py-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sentry-lime p-2 rounded text-sentry-primary">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-wide block uppercase">АНТИФРОД МОНИТОРИНГ</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase block">ДЭР по области Абай АФМ РК</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex bg-black/35 rounded-lg border border-borderGrey p-0.5 gap-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider transition rounded-md ${
              activeTab === 'dashboard'
                ? 'bg-zinc-800 text-white font-bold border border-borderGrey'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <BarChart3 size={14} className="text-sentry-lime" />
            Дашборд
          </button>

          <button
            onClick={() => setActiveTab('map')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider transition rounded-md ${
              activeTab === 'map'
                ? 'bg-zinc-800 text-white font-bold border border-borderGrey'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Globe size={14} className="text-teal-400" />
            Карта Фрода
          </button>
          
          <button
            onClick={() => setActiveTab('monitor')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider transition rounded-md ${
              activeTab === 'monitor'
                ? 'bg-zinc-800 text-white font-bold border border-borderGrey'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={14} className="text-sentry-pink" />
            Live Монитор
          </button>

          <button
            onClick={() => setActiveTab('cases')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider transition rounded-md relative ${
              activeTab === 'cases'
                ? 'bg-zinc-800 text-white font-bold border border-borderGrey'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <AlertOctagon size={14} className="text-risk-blocked" />
            Инциденты
            {stats.kpis.blocked_count + stats.kpis.suspicion_count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-risk-blocked text-white text-[8px] font-mono font-bold w-4 h-4 rounded-full flex items-center justify-center border border-bgDark animate-pulse">
                {stats.kpis.blocked_count + stats.kpis.suspicion_count}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('zags')}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-mono uppercase tracking-wider transition rounded-md ${
              activeTab === 'zags'
                ? 'bg-zinc-800 text-white font-bold border border-borderGrey'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <UserCheck size={14} className="text-purple-400" />
            Сверка ЗАГС
          </button>

          <div className="h-6 w-px bg-[#362d59] my-auto mx-1" />

          <button
            onClick={() => setIsMLOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider text-purple-300 hover:text-white bg-[#1f1633] hover:bg-[#422082] border border-[#362d59] hover:border-[#6a5fc1] rounded-md transition shadow-md"
          >
            <Cpu size={14} className="text-[#c2ef4e]" />
            AI / ML Модель
          </button>
        </nav>

        {/* Live Counters */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1">
            <CheckCircle size={12} className="text-risk-approved" />
            <span className="text-gray-400">Одобрено:</span>
            <span className="text-white font-bold">{stats.kpis.total_checked - stats.kpis.blocked_count - stats.kpis.suspicion_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <HelpCircle size={12} className="text-risk-suspicion" />
            <span className="text-gray-400">Подозрительно:</span>
            <span className="text-white font-bold">{stats.kpis.suspicion_count}</span>
          </div>
          <div className="flex items-center gap-1">
            <ShieldAlert size={12} className="text-risk-blocked" />
            <span className="text-gray-400">Блокировано:</span>
            <span className="text-white font-bold">{stats.kpis.blocked_count}</span>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 min-h-0 relative overflow-y-auto flex flex-col justify-between">
        <div className="flex-1">
          {renderActiveTab()}
        </div>

        {/* Rich Multi-Column Footer */}
        <footer className="w-full bg-[#0d0a14] border-t border-borderGrey pt-8 pb-6 px-6 lg:px-12 mt-auto shrink-0">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 text-xs font-sans mb-8">
            
            {/* Col 1: Brand & Description */}
            <div className="space-y-3 lg:col-span-1">
              <div className="flex items-center gap-2">
                <div className="bg-sentry-lime p-1.5 rounded text-sentry-primary">
                  <ShieldAlert size={16} />
                </div>
                <span className="font-bold text-white tracking-wider uppercase text-sm">АНТИФРОД МОНИТОРИНГ</span>
              </div>
              <p className="text-gray-400 leading-relaxed text-[11px]">
                Система автоматизированного выявления приписок и аномалий в медицинских услугах ФСМС. Разработано для Департамента экономических расследований по области Абай.
              </p>
            </div>

            {/* Col 2: Project Info */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-gray-200 font-bold uppercase tracking-wider text-[11px] mb-3">
                <Users size={14} className="text-sentry-lime" />
                <span>ПРОЕКТ</span>
              </div>
              <ul className="space-y-2 text-gray-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <Building2 size={13} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>Руководство: <strong className="text-gray-200 font-medium">ДЭР по области Абай</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <ShieldAlert size={13} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>Ведомство: <strong className="text-gray-200 font-medium">АФМ РК</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Globe size={13} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>Регион: <strong className="text-gray-200 font-medium">Область Абай</strong></span>
                </li>
              </ul>
            </div>

            {/* Col 3: Tech Stack */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-gray-200 font-bold uppercase tracking-wider text-[11px] mb-3">
                <Layers size={14} className="text-sentry-pink" />
                <span>СТЕК</span>
              </div>
              <ul className="space-y-1.5 text-gray-400 font-mono text-[11px]">
                <li className="flex items-center gap-1.5">
                  <Cpu size={12} className="text-gray-500" />
                  <span>Python 3.10 / FastAPI</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Code2 size={12} className="text-gray-500" />
                  <span>React 19 / Vite / Tailwind v4</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Globe size={12} className="text-gray-500" />
                  <span>D3.js / React Simple Maps</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Server size={12} className="text-gray-500" />
                  <span>Docker / Uvicorn</span>
                </li>
              </ul>
            </div>

            {/* Col 4: Data Sources */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-gray-200 font-bold uppercase tracking-wider text-[11px] mb-3">
                <Database size={14} className="text-teal-400" />
                <span>ИСТОЧНИКИ ДАННЫХ</span>
              </div>
              <ul className="space-y-2 text-gray-400 text-[11px]">
                <li className="flex items-start gap-1.5">
                  <FileText size={13} className="text-amber-400 shrink-0 mt-0.5" />
                  <span>Генератор: <strong className="text-gray-200 font-medium">Simulation Engine</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Activity size={13} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>База ЗАГС: <strong className="text-gray-200 font-medium">Симулируемый реестр</strong></span>
                </li>
                <li className="flex items-start gap-1.5">
                  <Building2 size={13} className="text-gray-500 shrink-0 mt-0.5" />
                  <span>Клиники: <strong className="text-gray-200 font-medium">Реестр медорганизаций</strong></span>
                </li>
              </ul>
            </div>

            {/* Col 5: Disclaimer & Org */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 text-gray-200 font-bold uppercase tracking-wider text-[11px] mb-3">
                <CheckCircle size={14} className="text-risk-approved" />
                <span>СТАТУС СИСТЕМЫ</span>
              </div>
              <div className="bg-zinc-900/80 border border-borderGrey p-3 rounded-md space-y-1.5">
                <span className="text-[10px] font-mono text-sentry-lime uppercase font-bold block">Среда эмуляции</span>
                <p className="text-[11px] text-gray-400 leading-snug">
                  Все медицинские логи и персональные данные сформированы виртуальным эмулятором.
                </p>
              </div>
            </div>

          </div>

          {/* Bottom Bar */}
          <div className="max-w-7xl mx-auto pt-4 border-t border-borderGrey/60 flex flex-col sm:flex-row justify-between items-center text-[10px] font-mono text-gray-500 gap-2">
            <span>
              &copy; {new Date().getFullYear()} Департамент экономических расследований по области Абай АФМ РК
            </span>
            <span className="text-amber-400/90 font-medium">
              Данные сгенерированы виртуальным эмулятором транзакций в целях демонстрации.
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}
