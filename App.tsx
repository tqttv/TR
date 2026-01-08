import React, { useState, useMemo, useEffect } from 'react';
import { DeviceData, FilterState } from './types';
import Sidebar from './components/Sidebar';
import DataView from './components/DataView';
import FileUploader from './components/FileUploader';
import { Menu, X, Zap } from 'lucide-react';

const App: React.FC = () => {
  // Store all sheets: Key = SheetName, Value = Data
  const [sheetsData, setSheetsData] = useState<Record<string, DeviceData[]> | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  
  // Responsive Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Dark Mode State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // Check local storage or system preference
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme');
        if (saved) return saved === 'dark';
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply Dark Mode Class
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const [filters, setFilters] = useState<FilterState>({
    station: '',
    area: ''
  });

  // Handle data loaded from file uploader (multiple sheets)
  const handleDataLoaded = (data: Record<string, DeviceData[]>) => {
      setSheetsData(data);
      const sheetNames = Object.keys(data);
      if (sheetNames.length > 0) {
          setActiveSheet(sheetNames[0]);
      }
  };

  // Get current active sheet data
  const currentData = useMemo(() => {
      if (!sheetsData || !activeSheet) return [];
      return sheetsData[activeSheet] || [];
  }, [sheetsData, activeSheet]);

  // Extract unique Areas for CURRENT sheet
  const uniqueAreas = useMemo(() => {
    if (!currentData) return [];
    const areas = new Set<string>();
    currentData.forEach(item => {
        const a = item.areaName;
        if (typeof a === 'string' && a.trim() !== '' && a.toLowerCase() !== 'null') {
            areas.add(a.trim());
        }
    });
    return Array.from(areas).sort((a, b) => a.localeCompare(b, 'ar'));
  }, [currentData]);

  // Extract unique stations for CURRENT sheet, optionally filtered by Area
  const uniqueStations = useMemo(() => {
    if (!currentData) return [];
    
    const stations = new Set<string>();
    
    currentData.forEach(item => {
        // If an area is selected, only show stations in that area
        if (filters.area && item.areaName !== filters.area) {
            return;
        }

        const s = item.stationName;
        if (typeof s === 'string' && 
            s.trim() !== '' && 
            s !== 'غير محدد' &&
            s.toLowerCase() !== 'substation' &&
            s.toLowerCase() !== 'null') {
            stations.add(s.trim());
        }
    });
    
    const list = Array.from(stations).sort((a, b) => a.localeCompare(b, 'ar'));
    
    // Add 'غير محدد' if needed (e.g. for generic sheets)
    const hasUndefined = currentData.some(d => d.stationName === 'غير محدد' && (!filters.area || d.areaName === filters.area));
    if (hasUndefined) {
        list.push('غير محدد');
    }

    return list;
  }, [currentData, filters.area]);

  // Filter logic for CURRENT sheet
  const filteredData = useMemo(() => {
    if (!currentData) return [];
    return currentData.filter(item => {
      let match = true;
      // Filter by Area
      if (filters.area && item.areaName !== filters.area) {
          match = false;
      }
      // Filter by Station
      if (match && filters.station && item.stationName !== filters.station) {
          match = false;
      }
      return match;
    });
  }, [currentData, filters]);

  const handleReset = () => {
    setSheetsData(null);
    setActiveSheet('');
    setFilters({ station: '', area: '' });
  };

  const handleSheetChange = (sheetName: string) => {
      setActiveSheet(sheetName);
      setFilters({ station: '', area: '' }); // Reset filters when switching sheets
  };

  // If no data, show uploader (but with theme toggle capability)
  if (!sheetsData) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="absolute top-4 left-4 z-50">
                <button 
                    onClick={toggleTheme}
                    className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-md border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-yellow-400 hover:scale-105 transition"
                >
                     {isDarkMode ? '☀️' : '🌙'}
                </button>
            </div>
            <FileUploader onDataLoaded={handleDataLoaded} />
        </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-slate-900 transition-colors duration-300">
      
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 z-40 px-4 py-3 flex justify-between items-center shadow-sm">
         <div className="flex items-center gap-2 font-bold text-gray-800 dark:text-white">
             <Zap className="text-primary" size={20} />
             <span>لوحة البيانات</span>
         </div>
         <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600 dark:text-gray-300">
             <Menu size={24} />
         </button>
      </div>

      {/* Sidebar Overlay for Mobile */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
      )}

      {/* Sidebar */}
      <div className={`
          fixed inset-y-0 right-0 z-50 w-72 bg-white dark:bg-slate-800 shadow-2xl transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 md:shadow-none md:border-l dark:md:border-slate-700
          ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
      `}>
          <div className="h-full flex flex-col">
              <div className="md:hidden p-4 flex justify-end border-b border-gray-100 dark:border-slate-700">
                  <button onClick={() => setIsSidebarOpen(false)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">
                      <X size={24} />
                  </button>
              </div>
              <Sidebar 
                stations={uniqueStations}
                areas={uniqueAreas}
                filters={filters}
                setFilters={setFilters}
                onReset={handleReset}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
              />
          </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden pt-14 md:pt-0 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
        <DataView 
          data={filteredData} 
          filters={filters}
          sheetNames={Object.keys(sheetsData)}
          activeSheet={activeSheet}
          onSheetChange={handleSheetChange}
        />
      </main>
    </div>
  );
};

export default App;