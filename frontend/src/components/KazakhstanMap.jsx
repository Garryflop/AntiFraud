import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Building2, 
  ShieldAlert, 
  CheckCircle, 
  HelpCircle, 
  Activity, 
  ArrowRight,
  TrendingUp,
  FileText
} from 'lucide-react';

// Static clinic mappings to match backend database
const CLINICS_BY_CITY = {
  "Семей": [
    { id: "CL-01", name: "Медицинский центр 'Шығыс'" },
    { id: "CL-02", name: "Городская больница №1" }
  ],
  "Астана": [
    { id: "CL-03", name: "Национальный научный кардиоцентр" },
    { id: "CL-04", name: "Клиника 'Daulet'" }
  ],
  "Алматы": [
    { id: "CL-05", name: "Центральная клиническая больница" },
    { id: "CL-06", name: "Медицинский центр 'Sana'" }
  ],
  "Шымкент": [
    { id: "CL-07", name: "Шымкентская городская поликлиника №2" }
  ],
  "Караганда": [
    { id: "CL-08", name: "Областная клиническая больница" }
  ]
};

// All major cities for map render context
const CITIES = [
  // Active Cities (from seed data)
  { id: "astana", name: "Астана", x: 520, y: 190, active: true },
  { id: "almaty", name: "Алматы", x: 740, y: 440, active: true },
  { id: "shymkent", name: "Шымкент", x: 540, y: 490, active: true },
  { id: "karaganda", name: "Караганда", x: 580, y: 260, active: true },
  { id: "semey", name: "Семей", x: 820, y: 240, active: true },

  // Inactive background cities (for visual integrity)
  { id: "atyrau", name: "Атырау", x: 160, y: 320, active: false },
  { id: "aktau", name: "Актау", x: 130, y: 420, active: false },
  { id: "aktobe", name: "Актобе", x: 320, y: 260, active: false },
  { id: "uralsk", name: "Уральск", x: 120, y: 160, active: false },
  { id: "kostanay", name: "Костанай", x: 420, y: 120, active: false },
  { id: "pavlodar", name: "Павлодар", x: 700, y: 150, active: false },
  { id: "oskemen", name: "Усть-Каменогорск", x: 880, y: 240, active: false },
  { id: "petropavl", name: "Петропавловск", x: 520, y: 70, active: false },
  { id: "kokshetau", name: "Кокшетау", x: 500, y: 120, active: false },
  { id: "taraz", name: "Тараз", x: 600, y: 470, active: false },
  { id: "kyzylorda", name: "Кызылорда", x: 400, y: 400, active: false },
  { id: "turkestan", name: "Туркестан", x: 470, y: 460, active: false },
  { id: "taldykorgan", name: "Талдыкорган", x: 770, y: 390, active: false },
  { id: "zhezkazgan", name: "Жезказган", x: 460, y: 310, active: false }
];

// Connection lines representation (visual network effect)
const CONNECTIONS = [
  { from: "astana", to: "kokshetau" },
  { from: "astana", to: "karaganda" },
  { from: "astana", to: "pavlodar" },
  { from: "astana", to: "kostanay" },
  { from: "almaty", to: "taldykorgan" },
  { from: "almaty", to: "taraz" },
  { from: "almaty", to: "shymkent" },
  { from: "shymkent", to: "taraz" },
  { from: "shymkent", to: "turkestan" },
  { from: "karaganda", to: "zhezkazgan" },
  { from: "karaganda", to: "semey" },
  { from: "semey", to: "oskemen" },
  { from: "semey", to: "pavlodar" },
  { from: "aktobe", to: "uralsk" },
  { from: "aktobe", to: "atyrau" },
  { from: "aktobe", to: "kostanay" },
  { from: "aktobe", to: "kyzylorda" },
  { from: "atyrau", to: "aktau" },
  { from: "atyrau", to: "uralsk" },
  { from: "kyzylorda", to: "turkestan" },
  { from: "kyzylorda", to: "zhezkazgan" }
];

export default function KazakhstanMap() {
  const { stats, cases } = useApp();
  const [selectedCity, setSelectedCity] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);

  // Extract region distribution metrics
  const regionMetrics = stats.charts.region_distribution || [];

  // Match coordinate nodes helper
  const getCityCoords = (cityId) => {
    const city = CITIES.find(c => c.id === cityId);
    return city ? { x: city.x, y: city.y } : { x: 0, y: 0 };
  };

  // Compile stats for active cities
  const getCityStats = (cityName) => {
    const metrics = regionMetrics.find(r => r.region.toLowerCase() === cityName.toLowerCase());
    
    // Calculate total prevented losses for blocked cases in this city
    const cityCases = cases.filter(c => c.clinic?.region.toLowerCase() === cityName.toLowerCase());
    const preventedLosses = cityCases
      .filter(c => c.status === 'BLOCKED')
      .reduce((sum, c) => sum + (c.service?.cost || 0), 0);

    return {
      total: metrics?.total || 0,
      approved: metrics?.approved || 0,
      suspicion: metrics?.suspicion || 0,
      blocked: metrics?.blocked || 0,
      preventedLosses
    };
  };

  const getStatusColor = (cityStats) => {
    if (cityStats.blocked > 0) return 'text-risk-blocked fill-risk-blocked';
    if (cityStats.suspicion > 0) return 'text-risk-suspicion fill-risk-suspicion';
    return 'text-risk-approved fill-risk-approved';
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);
  };

  // Click handler
  const handleCityClick = (city) => {
    if (!city.active) return;
    const cityStats = getCityStats(city.name);
    setSelectedCity({
      ...city,
      stats: cityStats
    });
  };

  return (
    <div className="flex h-full bg-bgDark">
      {/* Map visualization pane */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            География инцидентов и аномалий
            <span className="text-xs bg-sentry-violetDeep/50 text-white border border-sentry-violet/40 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">КОНТРОЛЬ</span>
          </h2>
          <p className="text-sm text-gray-400">Сетевая топология фрод-активности медицинских организаций в разрезе филиалов</p>
        </div>

        {/* Outer Interactive SVG Container */}
        <div className="flex-1 bg-[#100f13]/80 border border-borderGrey rounded-2xl relative p-4 flex items-center justify-center overflow-hidden">
          {/* Cyber grid background layer */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1e29_1px,transparent_1px),linear-gradient(to_bottom,#1f1e29_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
          
          <svg 
            className="w-full h-full max-h-[550px] relative z-10" 
            viewBox="0 0 1000 550" 
            preserveAspectRatio="xMidYMid meet"
          >
            {/* 1. Styled Vector Borders of Kazakhstan (Simplified Polygonal Outline) */}
            <path 
              d="M 100,280 L 120,200 L 220,180 L 320,150 L 420,170 L 480,100 L 580,110 L 680,160 L 780,140 L 880,240 L 920,280 L 880,360 L 840,400 L 760,420 L 700,500 L 580,520 L 500,540 L 420,440 L 340,430 L 280,450 L 220,440 L 160,470 L 120,420 L 80,360 Z" 
              className="fill-[#14131b] stroke-sentry-violet/20 stroke-[1.5] transition duration-300 hover:fill-[#171620] hover:stroke-sentry-violet/30"
            />

            {/* 2. Cyber communication connection link paths */}
            {CONNECTIONS.map((conn, idx) => {
              const fromCoords = getCityCoords(conn.from);
              const toCoords = getCityCoords(conn.to);
              return (
                <line
                  key={idx}
                  x1={fromCoords.x}
                  y1={fromCoords.y}
                  x2={toCoords.x}
                  y2={toCoords.y}
                  className="stroke-sentry-violet/10 stroke-[1] stroke-dasharray-[4,4]"
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* 3. Render Inactive background cities (Gray small dots) */}
            {CITIES.filter(c => !c.active).map((city) => (
              <g key={city.id} className="opacity-40 select-none">
                <circle 
                  cx={city.x} 
                  cy={city.y} 
                  r={3.5} 
                  className="fill-gray-600 stroke-gray-800 stroke-[1]"
                />
                <text 
                  x={city.x} 
                  y={city.y - 8} 
                  textAnchor="middle" 
                  className="fill-gray-500 font-mono text-[9px] font-medium"
                >
                  {city.name}
                </text>
              </g>
            ))}

            {/* 4. Render Active pulsing city nodes */}
            {CITIES.filter(c => c.active).map((city) => {
              const cityStats = getCityStats(city.name);
              const isSelected = selectedCity?.id === city.id;
              const isHovered = hoveredCity?.id === city.id;
              
              // Pulsing circle ring severity
              let pulseColor = "stroke-risk-approved";
              let dotColor = "fill-risk-approved";
              if (cityStats.blocked > 0) {
                pulseColor = "stroke-risk-blocked";
                dotColor = "fill-risk-blocked";
              } else if (cityStats.suspicion > 0) {
                pulseColor = "stroke-risk-suspicion";
                dotColor = "fill-risk-suspicion";
              }

              return (
                <g 
                  key={city.id} 
                  className="cursor-pointer"
                  onClick={() => handleCityClick(city)}
                  onMouseEnter={() => setHoveredCity(city)}
                  onMouseLeave={() => setHoveredCity(null)}
                >
                  {/* Glowing/Pulsing outer circle ring */}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={isSelected ? 16 : isHovered ? 12 : 8}
                    className={`fill-none ${pulseColor} stroke-2 animate-ping opacity-25`}
                    style={{ animationDuration: cityStats.blocked > 0 ? '1.5s' : '3s' }}
                  />

                  {/* Node solid dot */}
                  <circle
                    cx={city.x}
                    cy={city.y}
                    r={isSelected ? 6 : 5}
                    className={`${dotColor} stroke-[#111015] stroke-2 transition duration-200`}
                  />

                  {/* City Text Label */}
                  <text
                    x={city.x}
                    y={city.y - 12}
                    textAnchor="middle"
                    className={`font-mono text-[10px] font-bold tracking-wide select-none transition ${
                      isSelected ? 'fill-white text-shadow' : isHovered ? 'fill-gray-200' : 'fill-gray-400'
                    }`}
                  >
                    {city.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Hover Tooltip Overlay */}
          {hoveredCity && (
            <div 
              className="absolute bg-[#15141c]/95 border border-borderGrey p-3 rounded-lg shadow-2xl z-20 font-mono text-xs text-left space-y-2 pointer-events-none select-none max-w-[200px]"
              style={{
                left: `${getCityCoords(hoveredCity.id).x * 0.95}px`,
                top: `${getCityCoords(hoveredCity.id).y * 0.85}px`
              }}
            >
              <h4 className="font-sans font-bold text-white text-xs border-b border-borderGrey pb-1 uppercase tracking-wide">
                г. {hoveredCity.name}
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Всего проверено:</span>
                  <span className="text-white font-bold">{getCityStats(hoveredCity.name).total}</span>
                </div>
                <div className="flex justify-between gap-4 text-risk-approved">
                  <span>Одобрено:</span>
                  <span>{getCityStats(hoveredCity.name).approved}</span>
                </div>
                <div className="flex justify-between gap-4 text-risk-suspicion">
                  <span>Подозрение:</span>
                  <span>{getCityStats(hoveredCity.name).suspicion}</span>
                </div>
                <div className="flex justify-between gap-4 text-risk-blocked">
                  <span>Блокировано:</span>
                  <span>{getCityStats(hoveredCity.name).blocked}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Side details inspection pane */}
      <div className="w-80 border-l border-borderGrey bg-[#141417]/80 flex flex-col justify-between overflow-y-auto shrink-0">
        {selectedCity ? (
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div className="space-y-6">
              {/* Header */}
              <div className="border-b border-borderGrey pb-4">
                <div className="flex items-center gap-1.5 mb-1 text-gray-500 font-mono text-[10px]">
                  <MapPin size={12} className="text-sentry-violet" />
                  <span>КАЗАХСТАН / РЕГИОНАЛЬНЫЙ ФИЛИАЛ</span>
                </div>
                <h3 className="text-lg font-bold text-white font-mono uppercase">г. {selectedCity.name}</h3>
              </div>

              {/* Prevented Losses Metric */}
              <div className="bg-bgCard border border-borderGrey rounded-xl p-4 space-y-1.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                  <TrendingUp size={12} className="text-risk-approved" />
                  Предотвращено хищений ФСМС
                </span>
                <p className="text-xl font-mono font-bold text-risk-approved">
                  {formatCurrency(selectedCity.stats.preventedLosses)}
                </p>
              </div>

              {/* Stat breakdown */}
              <div className="bg-bgCard border border-borderGrey rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400">Статистика по региону</span>
                <div className="grid grid-cols-2 gap-y-2 text-xs font-mono">
                  <div className="text-gray-400">Проверенное:</div>
                  <div className="text-white text-right font-bold">{selectedCity.stats.total}</div>
                  
                  <div className="text-gray-400">Одобрено:</div>
                  <div className="text-risk-approved text-right font-semibold">{selectedCity.stats.approved}</div>
                  
                  <div className="text-gray-400">Подозрение:</div>
                  <div className="text-risk-suspicion text-right font-semibold">{selectedCity.stats.suspicion}</div>
                  
                  <div className="text-gray-400">Фрод Блок:</div>
                  <div className="text-risk-blocked text-right font-semibold">{selectedCity.stats.blocked}</div>
                </div>
              </div>

              {/* Clinics list in this region */}
              <div className="bg-bgCard border border-borderGrey rounded-xl p-4 space-y-3">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 border-b border-borderGrey pb-2">
                  <Building2 size={12} className="text-sentry-pink" />
                  Организации в реестре ({CLINICS_BY_CITY[selectedCity.name]?.length || 0})
                </span>
                <div className="space-y-2 max-h-[140px] overflow-y-auto">
                  {CLINICS_BY_CITY[selectedCity.name]?.map((clinic) => (
                    <div key={clinic.id} className="text-xs flex flex-col border-b border-borderGrey/30 pb-1.5 last:border-0 last:pb-0">
                      <span className="font-sans font-medium text-white">{clinic.name}</span>
                      <span className="font-mono text-[9px] text-gray-500">{clinic.id}</span>
                    </div>
                  )) || (
                    <div className="text-xs text-gray-600">Клиники не зарегистрированы</div>
                  )}
                </div>
              </div>

              {/* Recommendation card */}
              <div className="bg-sentry-violetDeep/10 border border-sentry-violet/30 rounded-xl p-4 space-y-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-wider text-gray-200 flex items-center gap-1">
                  <ShieldAlert size={12} className="text-risk-blocked" />
                  Предписание ДЭР РК
                </h4>
                <p className="text-xs text-gray-400 font-sans leading-relaxed">
                  {selectedCity.stats.blocked > 3 
                    ? `Усиленный контроль в г. ${selectedCity.name}. Выявлены множественные случаи жесткой блокировки (приписки, мертвые души). Направлена опергруппа для изъятия жестких дисков.`
                    : selectedCity.stats.blocked > 0
                    ? `Инициирована верификация данных в клиниках г. ${selectedCity.name} по сработавшим триггерам Hard Block.`
                    : `Показатели клиник г. ${selectedCity.name} стабильны, отклонений от лимитов не замечено. Плановое дежурство.`
                  }
                </p>
              </div>
            </div>

            <div className="text-[10px] text-gray-500 font-mono text-center mt-6">
              Код зоны филиала: KZ-{selectedCity.id.toUpperCase()}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-gray-500 text-center space-y-3 font-mono text-xs">
            <MapPin size={32} className="text-gray-700 animate-bounce" />
            <span>Выберите регион на карте для получения аналитических сведений</span>
          </div>
        )}
      </div>
    </div>
  );
}
