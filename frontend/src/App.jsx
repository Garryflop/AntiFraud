import React from 'react';
import { useApp } from './context/AppContext';
import Dashboard from './components/Dashboard';
import LiveMonitor from './components/LiveMonitor';
import FraudCases from './components/FraudCases';
import { 
  ShieldAlert, 
  Activity, 
  BarChart3, 
  AlertOctagon, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

export default function App() {
  const { activeTab, setActiveTab, stats } = useApp();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'monitor':
        return <LiveMonitor />;
      case 'cases':
        return <FraudCases />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen flex flex-col bg-bgDark overflow-hidden">
      {/* Sentry-Style Top Navigation Bar */}
      <header className="bg-[#150f23] border-b border-borderGrey px-6 py-4 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="bg-sentry-lime p-2 rounded text-sentry-primary">
            <ShieldAlert size={18} />
          </div>
          <div>
            <span className="font-bold text-white text-sm tracking-wide block uppercase">АНТИФРОД МОНИТОРИНГ</span>
            <span className="text-[10px] text-gray-400 font-mono tracking-wider uppercase block">ИИС Департамента экономических расследований</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex bg-black/35 rounded-lg border border-borderGrey p-0.5">
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
      <main className="flex-1 min-h-0 relative">
        {renderActiveTab()}
      </main>

      {/* Lime Squiggly Footer Divider from DESIGN.md */}
      <div className="w-full shrink-0 select-none bg-bgDark border-t border-borderGrey pt-2 px-6">
        <svg className="w-full h-3" viewBox="0 0 1200 12" preserveAspectRatio="none">
          <path 
            d="M0,6 Q75,12 150,6 T300,6 T450,6 T600,6 T750,6 T900,6 T1050,6 T1200,6" 
            fill="none" 
            stroke="#c2ef4e" 
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <footer className="py-2 flex justify-between items-center text-[10px] text-gray-500 font-mono">
          <span>&copy; {new Date().getFullYear()} Комитет по финансовому мониторингу МФ РК (ДЭР)</span>
          <span>Система обнаружения приписок и логических аномалий ФСМС</span>
        </footer>
      </div>
    </div>
  );
}
