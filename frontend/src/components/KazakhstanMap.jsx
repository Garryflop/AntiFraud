import React, { useState } from 'react';
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from 'react-simple-maps';
import { useApp } from '../context/AppContext';
import { 
  MapPin, 
  Building2, 
  ShieldAlert, 
  Activity, 
  ArrowRight,
  TrendingUp,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move
} from 'lucide-react';

const geoUrl = "/kazakhstan.json";

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
  ],
  "Атырау": [
    { id: "CL-09", name: "Атырауская областная больница" }
  ],
  "Актау": [
    { id: "CL-10", name: "Медицинский центр 'Маңғыстау'" }
  ],
  "Актобе": [
    { id: "CL-11", name: "Актюбинская многопрофильная больница" }
  ],
  "Уральск": [
    { id: "CL-12", name: "Западно-Казахстанский кардиоцентр" }
  ],
  "Костанай": [
    { id: "CL-13", name: "Костанайская городская больница" }
  ],
  "Павлодар": [
    { id: "CL-14", name: "Павлодарский диагностический центр" }
  ],
  "Усть-Каменогорск": [
    { id: "CL-15", name: "Восточно-Казахстанский областной центр" }
  ],
  "Петропавловск": [
    { id: "CL-16", name: "Северо-Казахстанская поликлиника №1" }
  ],
  "Кокшетау": [
    { id: "CL-17", name: "Акмолинская многопрофильная клиника" }
  ],
  "Тараз": [
    { id: "CL-18", name: "Жамбылская областная больница" }
  ],
  "Кызылорда": [
    { id: "CL-19", name: "Кызылординский медицинский центр" }
  ],
  "Туркестан": [
    { id: "CL-20", name: "Туркестанская областная поликлиника" }
  ],
  "Талдыкорган": [
    { id: "CL-21", name: "Жетысуская многопрофильная больница" }
  ],
  "Жезказган": [
    { id: "CL-22", name: "Многопрофильная больница г. Жезказган" }
  ]
};

// All major cities for georeferenced mapping (Longitude, Latitude)
const CITIES = [
  { id: "astana", name: "Астана", coordinates: [71.4491, 51.1605], active: true },
  { id: "almaty", name: "Алматы", coordinates: [76.8512, 43.2220], active: true },
  { id: "shymkent", name: "Шымкент", coordinates: [69.5901, 42.3417], active: true },
  { id: "karaganda", name: "Караганда", coordinates: [73.0878, 49.8047], active: true },
  { id: "semey", name: "Семей", coordinates: [80.2458, 50.4111], active: true },
  { id: "atyrau", name: "Атырау", coordinates: [51.9168, 47.0945], active: true },
  { id: "aktau", name: "Актау", coordinates: [51.1975, 43.6480], active: true },
  { id: "aktobe", name: "Актобе", coordinates: [57.2072, 50.2839], active: true },
  { id: "uralsk", name: "Уральск", coordinates: [51.3720, 51.2333], active: true },
  { id: "kostanay", name: "Костанай", coordinates: [63.6354, 53.2198], active: true },
  { id: "pavlodar", name: "Павлодар", coordinates: [76.9556, 52.2873], active: true },
  { id: "oskemen", name: "Усть-Каменогорск", coordinates: [82.6149, 49.9543], active: true },
  { id: "petropavl", name: "Петропавловск", coordinates: [69.1318, 54.8753], active: true },
  { id: "kokshetau", name: "Кокшетау", coordinates: [69.3861, 53.2833], active: true },
  { id: "taraz", name: "Тараз", coordinates: [71.3983, 42.9008], active: true },
  { id: "kyzylorda", name: "Кызылорда", coordinates: [65.5110, 44.8398], active: true },
  { id: "turkestan", name: "Туркестан", coordinates: [68.2711, 43.3031], active: true },
  { id: "taldykorgan", name: "Талдыкорган", coordinates: [78.3739, 45.0159], active: true },
  { id: "zhezkazgan", name: "Жезказган", coordinates: [67.7144, 47.7833], active: true }
];

export default function KazakhstanMap() {
  const { stats, cases } = useApp();
  const [selectedCity, setSelectedCity] = useState(null);
  const [hoveredCity, setHoveredCity] = useState(null);
  const [position, setPosition] = useState({ coordinates: [67.0, 48.0], zoom: 1 });

  const regionMetrics = stats.charts.region_distribution || [];

  // Maps GeoJSON region to DB city name
  const mapGeoToCityName = (geo) => {
    if (!geo || !geo.properties) return null;
    const key = (geo.properties["hc-key"] || geo.properties.shapeISO || "").toLowerCase();
    const name = (geo.properties.name || geo.properties.shapeName || "").toLowerCase();

    if (key === "kz-10" || name.includes("abai")) return "Семей";
    if (key === "kz-63" || name.includes("east kazakhstan") || name.includes("şığıs")) return "Усть-Каменогорск";
    if (key === "kz-33" || name.includes("jetısu") || name.includes("zhetysu")) return "Талдыкорган";
    if (key === "kz-62" || name.includes("ulıtaw") || name.includes("ulytau")) return "Жезказган";
    if (key === "kz-71" || key === "kz-ast" || name.includes("astana")) return "Астана";
    if (key === "kz-75" || key === "kz-ala" || name.includes("almaty qalasy")) return "Алматы";
    if (key === "kz-19" || name.includes("almaty")) return "Талдыкорган";
    if (key === "kz-79" || key === "kz-yuz" || name.includes("şymkent") || name.includes("shymkent")) return "Шымкент";
    if (key === "kz-35" || key === "kz-kar" || name.includes("qarağandy") || name.includes("karaganda")) return "Караганда";
    if (key === "kz-23" || key === "kz-aty" || name.includes("atyrau")) return "Атырау";
    if (key === "kz-47" || key === "kz-man" || name.includes("mañğystau") || name.includes("mangystau")) return "Актау";
    if (key === "kz-15" || key === "kz-akt" || name.includes("aqtöbe") || name.includes("aktobe")) return "Актобе";
    if (key === "kz-27" || key === "kz-zap" || name.includes("batys") || name.includes("west")) return "Уральск";
    if (key === "kz-39" || key === "kz-kus" || name.includes("qostanai") || name.includes("kostanay")) return "Костанай";
    if (key === "kz-55" || key === "kz-pav" || name.includes("pavlodar")) return "Павлодар";
    if (key === "kz-59" || key === "kz-sev" || name.includes("soltüstık") || name.includes("north")) return "Петропавловск";
    if (key === "kz-11" || key === "kz-akm" || name.includes("aqmola") || name.includes("akmola")) return "Кокшетау";
    if (key === "kz-31" || key === "kz-zha" || name.includes("jambyl")) return "Тараз";
    if (key === "kz-43" || key === "kz-kzy" || name.includes("qyzylorda") || name.includes("kyzylorda")) return "Кызылорда";
    if (key === "kz-61" || name.includes("türkıstan") || name.includes("turkestan")) return "Туркестан";

    return null;
  };

  const getCityStats = (cityName) => {
    if (!cityName) return { total: 0, approved: 0, suspicion: 0, blocked: 0, preventedLosses: 0 };
    
    const metrics = regionMetrics.find(r => r && r.region && r.region.toLowerCase() === cityName.toLowerCase());
    
    const cityCases = cases.filter(c => c && c.clinic && c.clinic.region && c.clinic.region.toLowerCase() === cityName.toLowerCase());
    const preventedLosses = cityCases
      .filter(c => c && c.status === 'BLOCKED')
      .reduce((sum, c) => sum + (c.service?.cost || 0), 0);

    return {
      total: metrics?.total || (cityCases.length > 0 ? cityCases.length : 0),
      approved: metrics?.approved || cityCases.filter(c => c.status === 'APPROVED').length,
      suspicion: metrics?.suspicion || cityCases.filter(c => c.status === 'SUSPICION').length,
      blocked: metrics?.blocked || cityCases.filter(c => c.status === 'BLOCKED').length,
      preventedLosses
    };
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'KZT', maximumFractionDigits: 0 }).format(val);
  };

  const handleCityClick = (cityName) => {
    const cityObj = CITIES.find(c => c.name.toLowerCase() === cityName.toLowerCase());
    if (!cityObj || !cityObj.active) return;
    const cityStats = getCityStats(cityName);
    setSelectedCity({
      ...cityObj,
      stats: cityStats
    });
  };

  const handleZoomIn = () => {
    setPosition((pos) => ({ ...pos, zoom: Math.min(pos.zoom * 1.4, 8) }));
  };

  const handleZoomOut = () => {
    setPosition((pos) => ({ ...pos, zoom: Math.max(pos.zoom / 1.4, 1) }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [67.0, 48.0], zoom: 1 });
  };

  const handleMoveEnd = (newPosition) => {
    setPosition(newPosition);
  };

  return (
    <div className="flex h-full bg-bgDark">
      {/* Map visualization pane */}
      <div className="flex-1 flex flex-col p-6 min-w-0">
        <div className="mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            География инцидентов и аномалий
            <span className="text-xs bg-sentry-violetDeep/50 text-white border border-sentry-violet/40 font-mono font-bold px-2 py-0.5 rounded uppercase tracking-wider">GEO-BOUNDARIES</span>
          </h2>
          <p className="text-sm text-gray-400">Топологическое картирование нарушений с использованием картографических данных ADM1</p>
        </div>

        {/* Map Container */}
        <div className="flex-1 bg-[#100f13]/85 border border-borderGrey rounded-2xl relative p-4 flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1e29_1px,transparent_1px),linear-gradient(to_bottom,#1f1e29_1px,transparent_1px)] bg-[size:30px_30px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30" />
          
          <div className="w-full h-full relative z-10 flex items-center justify-center">
            <ComposableMap
              projection="geoMercator"
              projectionConfig={{
                scale: 1150 // Centered and scaled slightly smaller to fit Kazakhstan fully
              }}
              width={900}
              height={500}
              style={{ width: "100%", height: "100%", maxHeight: "500px" }}
            >
              <ZoomableGroup
                zoom={position.zoom}
                center={position.coordinates}
                onMoveEnd={handleMoveEnd}
                maxZoom={8}
                minZoom={1}
              >
                {/* Region Boundaries Group */}
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map((geo) => {
                      const mappedCity = mapGeoToCityName(geo);
                      const isRegionActive = !!mappedCity;
                      const cityStats = getCityStats(mappedCity);
                      
                      // Heatmap colors based on database status
                      let fill = "#15141c";
                      let stroke = "rgba(90, 59, 184, 0.35)";
                      
                      if (isRegionActive) {
                        if (cityStats.blocked > 0) {
                          fill = "rgba(239, 68, 68, 0.15)";
                          stroke = "rgba(239, 68, 68, 0.6)";
                        } else if (cityStats.suspicion > 0) {
                          fill = "rgba(234, 179, 8, 0.12)";
                          stroke = "rgba(234, 179, 8, 0.5)";
                        } else {
                          fill = "rgba(34, 197, 94, 0.08)";
                          stroke = "rgba(34, 197, 94, 0.4)";
                        }
                      }

                      // Hover logic
                      const isSelected = selectedCity && mappedCity && selectedCity.name === mappedCity;

                      return (
                        <Geography
                          key={geo.rsmKey}
                          geography={geo}
                          onClick={() => mappedCity && handleCityClick(mappedCity)}
                          onMouseEnter={() => mappedCity && setHoveredCity(CITIES.find(c => c.name === mappedCity))}
                          onMouseLeave={() => setHoveredCity(null)}
                          style={{
                            default: {
                              fill: isSelected ? "rgba(90, 59, 184, 0.25)" : fill,
                              stroke: isSelected ? "#9065ff" : stroke,
                              strokeWidth: isSelected ? 1.5 : 1.0,
                              outline: "none",
                              transition: "all 250ms ease"
                            },
                            hover: {
                              fill: "rgba(90, 59, 184, 0.15)",
                              stroke: "#9065ff",
                              strokeWidth: 1.5,
                              outline: "none",
                              cursor: mappedCity ? "pointer" : "default"
                            },
                            pressed: {
                              fill: "rgba(90, 59, 184, 0.35)",
                              stroke: "#9065ff",
                              strokeWidth: 1.5,
                              outline: "none"
                            }
                          }}
                        />
                      );
                    })
                  }
                </Geographies>

                {/* Plotting Cities */}
                {CITIES.map((city) => {
                  const cityStats = getCityStats(city.name);
                  const isSelected = selectedCity?.id === city.id;
                  const isHovered = hoveredCity?.id === city.id;

                  let pulseColor = "stroke-risk-approved";
                  let dotColor = "fill-risk-approved";
                  
                  if (city.active) {
                    if (cityStats.blocked > 0) {
                      pulseColor = "stroke-risk-blocked";
                      dotColor = "fill-risk-blocked";
                    } else if (cityStats.suspicion > 0) {
                      pulseColor = "stroke-risk-suspicion";
                      dotColor = "fill-risk-suspicion";
                    }
                  } else {
                    dotColor = "fill-gray-600";
                  }

                  return (
                    <Marker 
                      key={city.id} 
                      coordinates={city.coordinates}
                      onClick={() => city.active && handleCityClick(city.name)}
                      onMouseEnter={() => city.active && setHoveredCity(city)}
                      onMouseLeave={() => setHoveredCity(null)}
                    >
                      {city.active && (
                        <circle
                          r={isSelected ? 14 : isHovered ? 11 : 8}
                          className={`fill-none ${pulseColor} stroke-2 animate-ping opacity-25 cursor-pointer`}
                          style={{ animationDuration: cityStats.blocked > 0 ? '1.5s' : '3s' }}
                        />
                      )}
                      <circle
                        r={city.active ? 4.5 : 2.5}
                        className={`${dotColor} stroke-[#111015] stroke-[1.5] ${city.active ? 'cursor-pointer hover:r-[6px]' : 'opacity-40'} transition-all`}
                      />
                      <text
                        textAnchor="middle"
                        y={-10}
                        className={`font-mono select-none pointer-events-none transition-all ${
                          city.active 
                            ? isSelected 
                              ? 'fill-white text-[10px] font-bold' 
                              : isHovered 
                                ? 'fill-gray-200 text-[9px] font-bold' 
                                : 'fill-gray-400 text-[9px] font-medium'
                            : 'fill-gray-600 text-[8px] opacity-40'
                        }`}
                      >
                        {city.name}
                      </text>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Navigation Controls & Hints Overlay */}
          <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2 z-20">
            {/* Zoom Controls */}
            <div className="flex bg-[#15141c]/95 border border-borderGrey rounded-lg overflow-hidden shadow-2xl">
              <button 
                onClick={handleZoomIn}
                className="p-2 text-gray-400 hover:text-white hover:bg-sentry-violet/20 border-r border-borderGrey/50 transition-colors cursor-pointer"
                title="Приблизить"
              >
                <ZoomIn size={16} />
              </button>
              <button 
                onClick={handleZoomOut}
                className="p-2 text-gray-400 hover:text-white hover:bg-sentry-violet/20 border-r border-borderGrey/50 transition-colors cursor-pointer"
                title="Отдалить"
              >
                <ZoomOut size={16} />
              </button>
              <button 
                onClick={handleReset}
                className="p-2 text-gray-400 hover:text-white hover:bg-sentry-violet/20 transition-colors cursor-pointer"
                title="Сбросить масштаб"
              >
                <RotateCcw size={16} />
              </button>
            </div>
            
            {/* Help Hint */}
            <div className="flex items-center gap-1.5 bg-[#15141c]/90 border border-borderGrey/60 px-3 py-1.5 rounded-lg text-[10px] text-gray-400 font-mono shadow-lg select-none">
              <Move size={12} className="text-sentry-violet" />
              <span>Перетаскивание</span>
              <span className="text-gray-600">|</span>
              <ZoomIn size={12} className="text-sentry-violet" />
              <span>Колесо мыши</span>
            </div>
          </div>

          {/* Hover Tooltip Overlay */}
          {hoveredCity && (
            <div 
              className="absolute bg-[#15141c]/95 border border-borderGrey p-3 rounded-lg shadow-2xl z-20 font-mono text-xs text-left space-y-2 pointer-events-none select-none max-w-[200px]"
              style={{
                bottom: "20px",
                left: "20px"
              }}
            >
              <h4 className="font-sans font-bold text-white text-xs border-b border-borderGrey pb-1 uppercase tracking-wide">
                г. {hoveredCity.name}
              </h4>
              <div className="space-y-1">
                <div className="flex justify-between gap-4">
                  <span className="text-gray-400">Проверено:</span>
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
                  <span>РЕГИОНАЛЬНЫЙ ФИЛИАЛ / ADM1</span>
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
            <span>Выберите регион или город на карте для получения аналитических сведений</span>
          </div>
        )}
      </div>
    </div>
  );
}
