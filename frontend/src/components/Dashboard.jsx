import React from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Activity, 
  Building2, 
  ArrowUpRight, 
  RefreshCw 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  Cell,
  PieChart,
  Pie
} from 'recharts';

export default function Dashboard() {
  const { stats, loading, refreshAllData } = useApp();

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);
  };

  const kpiList = [
    {
      title: "Всего транзакций проверено",
      value: stats.kpis.total_checked.toLocaleString(),
      icon: Activity,
      color: "text-sentry-violet",
      bgColor: "bg-sentry-violetDeep/20"
    },
    {
      title: "Предотвращено хищений",
      value: formatCurrency(stats.kpis.prevented_losses_kzt),
      icon: ShieldCheck,
      color: "text-risk-approved",
      bgColor: "bg-risk-approved/15"
    },
    {
      title: "Заблокировано фрод-запросов",
      value: stats.kpis.blocked_count.toLocaleString(),
      icon: ShieldAlert,
      color: "text-risk-blocked",
      bgColor: "bg-risk-blocked/15"
    },
    {
      title: "Клиники в красной зоне риска",
      value: stats.kpis.red_zone_clinics_count.toString(),
      icon: Building2,
      color: "text-risk-suspicion",
      bgColor: "bg-risk-suspicion/15"
    }
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#15151c] border border-borderGrey p-3 rounded shadow-xl font-mono text-xs">
          <p className="text-gray-400 mb-1">{label}</p>
          {payload.map((item, index) => (
            <p key={index} style={{ color: item.color }} className="font-semibold">
              {item.name}: {item.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const COLORS = ['#fa7faa', '#7c3aed', '#c2ef4e', '#f59e0b', '#f43f5e'];

  return (
    <div className="p-6 space-y-6 h-full overflow-y-auto">
      {/* Upper header action row */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Сводная аналитика
            <span className="text-xs bg-sentry-lime text-sentry-primary font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">ДЭР РК</span>
          </h2>
          <p className="text-sm text-gray-400">Панель оперативного анализа и автоматического выявления аномалий медицинских услуг ФСМС</p>
        </div>
        <button 
          onClick={refreshAllData}
          disabled={loading}
          className="flex items-center gap-2 bg-sentry-violet/20 hover:bg-sentry-violet/40 text-gray-200 border border-sentry-violet/40 px-3 py-1.5 rounded text-sm transition font-mono uppercase tracking-wider text-xs"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Обновить
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiList.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-bgCard border border-borderGrey rounded-xl p-5 hover:border-sentry-violet/50 transition duration-200 relative group overflow-hidden">
              {/* background brand light glow */}
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full filter blur-2xl opacity-10 transition duration-300 group-hover:opacity-20 ${kpi.bgColor}`} />
              <div className="flex justify-between items-start">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-gray-400">{kpi.title}</span>
                <div className={`p-2 rounded-lg ${kpi.bgColor} ${kpi.color}`}>
                  <Icon size={18} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-mono font-bold tracking-tight text-white">{kpi.value}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart (2 cols span) */}
        <div className="bg-bgCard border border-borderGrey rounded-xl p-5 lg:col-span-2 space-y-4">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-400">Тренд фрод-активности по дням</h3>
            <p className="text-xs text-gray-500">Динамика выявления одобренных, подозрительных и заблокированных запросов</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.charts.trend_by_day}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorApproved" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSuspicion" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d34" vertical={false} />
                <XAxis dataKey="date" stroke="#6b7280" tickLine={false} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: 10, fontFamily: 'monospace' }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
                <Area name="Одобрено" type="monotone" dataKey="approved" stroke="#10b981" fillOpacity={1} fill="url(#colorApproved)" />
                <Area name="Подозрение" type="monotone" dataKey="suspicion" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSuspicion)" />
                <Area name="Фрод Заблокирован" type="monotone" dataKey="blocked" stroke="#f43f5e" fillOpacity={1} fill="url(#colorBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top 5 scamming services pie chart */}
        <div className="bg-bgCard border border-borderGrey rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-400">Топ-5 самых скамящих услуг</h3>
            <p className="text-xs text-gray-500">Частота нарушений в разрезе медицинских манипуляций</p>
          </div>
          
          <div className="h-56 relative flex items-center justify-center my-3">
            {stats.charts.top_scammed_services.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">Нет данных о нарушениях</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.charts.top_scammed_services}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {stats.charts.top_scammed_services.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-[#15151c] border border-borderGrey p-2 rounded shadow-xl font-mono text-xs text-white">
                            <span className="font-semibold">{payload[0].name}</span>: {payload[0].value}
                          </div>
                        );
                      }
                      return null;
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5">
            {stats.charts.top_scammed_services.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 max-w-[80%]">
                  <span className="w-2.5 h-2.5 rounded-full inline-block shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span className="truncate text-gray-300 font-mono">{item.name}</span>
                </div>
                <span className="font-mono text-white font-bold">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Regional distribution list (full width bar chart) */}
      <div className="bg-bgCard border border-borderGrey rounded-xl p-5 space-y-4">
        <div>
          <h3 className="text-sm font-mono font-bold uppercase tracking-wider text-gray-400">Распределение фрода по регионам Казахстана</h3>
          <p className="text-xs text-gray-500">Сравнительный анализ обнаружения аномалий в разрезе филиалов клиник</p>
        </div>
        
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={stats.charts.region_distribution}
              margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2d2d34" vertical={false} />
              <XAxis dataKey="region" stroke="#6b7280" tickLine={false} style={{ fontSize: 11 }} />
              <YAxis stroke="#6b7280" tickLine={false} style={{ fontSize: 10, fontFamily: 'monospace' }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12, paddingTop: 10 }} />
              <Bar name="Одобрено" dataKey="approved" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
              <Bar name="Подозрение" dataKey="suspicion" stackId="a" fill="#f59e0b" radius={[0, 0, 0, 0]} />
              <Bar name="Фрод Заблокирован" dataKey="blocked" stackId="a" fill="#f43f5e" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
