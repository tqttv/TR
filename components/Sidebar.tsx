import React from 'react';
import { Filter, MapPin, Globe, RefreshCcw, Moon, Sun, Database } from 'lucide-react';
import { FilterState } from '../types';

interface SidebarProps {
  stations: string[];
  areas: string[];
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onReset: () => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
    stations, 
    areas, 
    filters, 
    setFilters, 
    onReset,
    isDarkMode,
    toggleTheme
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-800 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Header */}
      <div className="p-6 border-b border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-1">
            <h2 className="text-xl font-bold flex items-center gap-2 text-primary dark:text-teal-400">
            <Filter size={24} />
            لوحة التحكم
            </h2>
            <button 
                onClick={toggleTheme}
                className="p-2 rounded-lg bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-600 dark:text-yellow-400 transition-colors"
                title={isDarkMode ? "الوضع النهاري" : "الوضع الليلي"}
            >
                {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">تصفية البيانات وإدارة العرض</p>
      </div>

      {/* Filters Container */}
      <div className="flex-1 p-6 space-y-8 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-slate-700">
        
        {/* Statistics Summary (Optional mini dashboard) */}
        <div className="grid grid-cols-2 gap-2 mb-4">
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
                 <span className="block text-xs text-blue-600 dark:text-blue-400 font-bold mb-1">المناطق</span>
                 <span className="text-xl font-bold text-gray-800 dark:text-white">{areas.length}</span>
             </div>
             <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                 <span className="block text-xs text-amber-600 dark:text-amber-400 font-bold mb-1">المحطات</span>
                 <span className="text-xl font-bold text-gray-800 dark:text-white">{stations.length}</span>
             </div>
        </div>

        {/* Area Filter */}
        <div className="group">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
            <Globe size={16} className="text-gray-400 group-focus-within:text-primary" />
            المنطقة (Area)
          </label>
          <div className="relative">
            <select
              value={filters.area}
              onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value, station: '' }))} 
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary transition appearance-none outline-none font-medium"
            >
              <option value="">-- كل المناطق --</option>
              {areas.map(area => (
                <option key={area} value={area}>{area}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        {/* Station Filter */}
        <div className="group">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2 group-focus-within:text-primary transition-colors">
            <MapPin size={16} className="text-gray-400 group-focus-within:text-primary" />
            المحطة (Substation)
          </label>
          <div className="relative">
            <select
              value={filters.station}
              onChange={(e) => setFilters(prev => ({ ...prev, station: e.target.value }))}
              className="w-full p-3 bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-800 dark:text-white rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:focus:border-primary transition appearance-none outline-none font-medium"
            >
              <option value="">-- كل المحطات --</option>
              {stations.map(station => (
                <option key={station} value={station}>{station}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

      </div>

      {/* Footer / Reset Action */}
      <div className="p-6 border-t border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
        <button
          onClick={() => onReset()}
          className="w-full py-3 px-4 bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <RefreshCcw size={18} />
          رفع ملف جديد
        </button>
      </div>
    </div>
  );
};

export default Sidebar;