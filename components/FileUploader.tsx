import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, Database, AlertTriangle, Loader2 } from 'lucide-react';
import { processExcelData, generateMockData } from '../utils/excelHelpers';
import { DeviceData } from '../types';

interface FileUploaderProps {
  onDataLoaded: (sheets: Record<string, DeviceData[]>) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onDataLoaded }) => {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Core function to parse ArrayBuffer (used by both File Upload and Default File)
  const parseExcelBuffer = (arrayBuffer: ArrayBuffer) => {
    try {
      const wb = XLSX.read(arrayBuffer, { type: 'array' });
      
      if (wb.SheetNames.length === 0) {
          setError("الملف فارغ لا يحتوي على أوراق عمل.");
          return;
      }

      const allSheetsData: Record<string, DeviceData[]> = {};
      let hasAnyData = false;

      wb.SheetNames.forEach(sheetName => {
          const ws = wb.Sheets[sheetName];
          const rawDataArray = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];
          if (rawDataArray.length === 0) return;

          // Intelligent Header Detection
          let bestHeaderRowIndex = 0;
          let maxScore = 0;
          let maxFilledColumns = 0;

          for (let i = 0; i < Math.min(rawDataArray.length, 500); i++) {
              const row = rawDataArray[i];
              if (!Array.isArray(row) || row.length === 0) continue;

              let score = 0;
              const rowString = JSON.stringify(row).toLowerCase();
              const filledColumnsCount = row.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length;

              if (rowString.includes('substation')) score += 30;
              if (rowString.includes('area')) score += 30;
              if (rowString.includes('location')) score += 20;
              if (rowString.includes('division')) score += 20;
              
              if (score > maxScore) {
                  maxScore = score;
                  bestHeaderRowIndex = i;
              } else if (maxScore === 0 && filledColumnsCount > maxFilledColumns) {
                  maxFilledColumns = filledColumnsCount;
                  bestHeaderRowIndex = i;
              }
          }

          const data = XLSX.utils.sheet_to_json(ws, { range: bestHeaderRowIndex, defval: "" });
          const processed = processExcelData(data);
          
          if (processed.length > 0) {
              allSheetsData[sheetName] = processed;
              hasAnyData = true;
          }
      });

      if (!hasAnyData) {
          setError("لم يتم العثور على بيانات صالحة في أي ورقة عمل.");
          return;
      }
      
      onDataLoaded(allSheetsData);

    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء معالجة البيانات.");
    }
  };

  // 1. Handle File Upload
  const processFile = (file: File) => {
    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (arrayBuffer) {
            parseExcelBuffer(arrayBuffer as ArrayBuffer);
        }
      } catch (err) {
        setError("حدث خطأ أثناء قراءة الملف.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          processFile(e.dataTransfer.files[0]);
      }
  };

  // 2. Handle Default File (Fetch from public folder with Fallback)
  const handleLoadDefaultData = async () => {
    setError(null);
    setIsProcessing(true);
    
    try {
        // Attempt to fetch the file
        const response = await fetch('./default_stations.xlsx');
        
        if (response.ok) {
            // File exists, parse it
            const arrayBuffer = await response.arrayBuffer();
            parseExcelBuffer(arrayBuffer);
        } else {
            // File not found (404), fallback to generated mock data
            console.warn("default_stations.xlsx not found, falling back to mock data.");
            const mockData = generateMockData();
            // mockData is now a Record<string, DeviceData[]>, so we pass it directly
            onDataLoaded(mockData);
        }
        
    } catch (err) {
        console.error("Default data load error, using fallback:", err);
        // Fallback on network error as well
        const mockData = generateMockData();
        onDataLoaded(mockData);
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center animate-in fade-in zoom-in-95 duration-500">
      <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-3xl shadow-2xl border border-gray-100 dark:border-slate-700 max-w-lg w-full transition-colors duration-300">
        <div className="mb-6 flex justify-center text-primary dark:text-teal-400">
          <FileSpreadsheet size={80} strokeWidth={1.5} />
        </div>
        
        <h1 className="text-3xl font-bold mb-3 text-gray-800 dark:text-white">مرحباً بك</h1>
        <p className="text-gray-500 dark:text-gray-400 mb-8">قم برفع ملف Excel الخاص بالمحطات والأجهزة (يتم دعم ملفات متعددة الأوراق)</p>

        {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-300 rounded-xl flex items-center gap-3 text-right">
                <AlertTriangle className="flex-shrink-0" size={24} />
                <p className="text-sm font-semibold">{error}</p>
            </div>
        )}

        <div className="space-y-4">
          <label 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={`
                flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300
                ${isDragOver 
                    ? 'border-primary bg-primary/10 dark:bg-primary/20 scale-[1.02]' 
                    : 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 hover:border-primary dark:hover:border-primary'
                }
                ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
              {isProcessing ? (
                  <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
              ) : (
                  <Upload className={`w-10 h-10 mb-3 ${isDragOver ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`} />
              )}
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-bold text-gray-700 dark:text-gray-200">اضغط للرفع</span> أو اسحب الملف هنا</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">ملفات .xlsx أو .xls</p>
            </div>
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isProcessing} />
          </label>

          <div className="relative flex py-2 items-center">
            <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 dark:text-gray-500 text-sm font-medium">البيانات الافتراضية</span>
            <div className="flex-grow border-t border-gray-200 dark:border-slate-700"></div>
          </div>

          <button 
            onClick={handleLoadDefaultData}
            disabled={isProcessing}
            className="w-full py-3.5 px-4 bg-secondary dark:bg-amber-600 text-white font-bold rounded-xl shadow hover:bg-amber-600 dark:hover:bg-amber-500 transition flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isProcessing ? <Loader2 size={20} className="animate-spin" /> : <Database size={20} />}
            بيانات المحطات
          </button>
        </div>
      </div>
      
      <div className="mt-8 p-5 bg-blue-50 dark:bg-slate-800/80 border border-blue-100 dark:border-slate-700 rounded-2xl text-sm text-gray-600 dark:text-gray-400 max-w-md w-full text-right shadow-sm">
        <p className="font-bold mb-2 text-blue-800 dark:text-blue-300">مميزات جديدة:</p>
        <ul className="list-disc list-inside space-y-1 marker:text-blue-500">
            <li>دعم الوضع الليلي (Dark Mode)</li>
            <li>تحسين استيراد الجداول تلقائياً</li>
            <li>واجهة متجاوبة مع الجوال</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;