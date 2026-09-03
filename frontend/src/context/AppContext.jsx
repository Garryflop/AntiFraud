import React, { createContext, useState, useEffect, useContext } from 'react';

const AppContext = createContext();

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const AppProvider = ({ children }) => {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'monitor', 'cases'
  const [transactions, setTransactions] = useState([]);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [stats, setStats] = useState({
    kpis: {
      total_checked: 0,
      prevented_losses_kzt: 0,
      blocked_count: 0,
      red_zone_clinics_count: 0,
      suspicion_count: 0
    },
    charts: {
      trend_by_day: [],
      region_distribution: [],
      top_scammed_services: []
    }
  });
  const [cases, setCases] = useState([]);
  const [selectedCase, setSelectedCase] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Date Filtering State for Analytics & Map
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [datePreset, setDatePreset] = useState('ALL'); // 'ALL', '2026', '2025', '2024', '2023', 'CUSTOM'

  // Filtering & Pagination for Live Monitor
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const fetchStats = async (overrideStart = startDate, overrideEnd = endDate) => {
    try {
      const url = new URL(`${API_BASE_URL}/api/dashboard/stats`);
      if (overrideStart) url.searchParams.append('start_date', overrideStart);
      if (overrideEnd) url.searchParams.append('end_date', overrideEnd);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchCases = async (overrideStart = startDate, overrideEnd = endDate) => {
    try {
      const url = new URL(`${API_BASE_URL}/api/dashboard/cases`);
      if (overrideStart) url.searchParams.append('start_date', overrideStart);
      if (overrideEnd) url.searchParams.append('end_date', overrideEnd);

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setCases(data);
        if (data.length > 0 && !selectedCase) {
          setSelectedCase(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching cases:', err);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const url = new URL(`${API_BASE_URL}/api/transactions`);
      url.searchParams.append('status', statusFilter);
      url.searchParams.append('page', page);
      url.searchParams.append('page_size', pageSize);
      if (searchQuery) {
        url.searchParams.append('search', searchQuery);
      }
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setTransactions(data.items);
        setTotalTransactions(data.total);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const setDateFilter = (preset, start = '', end = '') => {
    setDatePreset(preset);
    let s = start;
    let e = end;
    if (preset === 'ALL') {
      s = ''; e = '';
    } else if (preset === '2026') {
      s = '2026-01-01'; e = '2026-12-31';
    } else if (preset === '2025') {
      s = '2025-01-01'; e = '2025-12-31';
    } else if (preset === '2024') {
      s = '2024-01-01'; e = '2024-12-31';
    } else if (preset === '2023') {
      s = '2023-01-01'; e = '2023-12-31';
    }
    setStartDate(s);
    setEndDate(e);
    fetchStats(s, e);
    fetchCases(s, e);
  };

  // Main reload function
  const refreshAllData = async () => {
    await Promise.all([fetchStats(startDate, endDate), fetchCases(startDate, endDate), fetchTransactions()]);
  };

  // Trigger data fetches on filter change
  useEffect(() => {
    fetchTransactions();
  }, [statusFilter, searchQuery, page]);

  // Initial load
  useEffect(() => {
    refreshAllData();
  }, []);

  const generateSimulationLogs = async (count = 100) => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/simulation/generate?count=${count}`, {
        method: 'POST',
      });
      if (res.ok) {
        await refreshAllData();
      }
    } catch (err) {
      console.error('Error generating simulation:', err);
    } finally {
      setLoading(false);
    }
  };

  const resetSimulation = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/simulation/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        setSelectedCase(null);
        await refreshAllData();
      }
    } catch (err) {
      console.error('Error resetting database:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkCustomTransaction = async (payload) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/transactions/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        await refreshAllData();
        return data;
      }
    } catch (err) {
      console.error('Error checking transaction:', err);
      throw err;
    }
  };

  return (
    <AppContext.Provider
      value={{
        API_BASE_URL,
        activeTab,
        setActiveTab,
        transactions,
        totalTransactions,
        stats,
        cases,
        selectedCase,
        setSelectedCase,
        loading,
        statusFilter,
        setStatusFilter,
        searchQuery,
        setSearchQuery,
        page,
        setPage,
        pageSize,
        startDate,
        endDate,
        datePreset,
        setDateFilter,
        setStartDate,
        setEndDate,
        fetchStats,
        fetchCases,
        generateSimulationLogs,
        resetSimulation,
        checkCustomTransaction,
        refreshAllData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
