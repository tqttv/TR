import React, { useMemo, useState } from 'react';
import { DeviceData, FilterState, INTERNAL_KEYS } from '../types';
import { Printer, AlertCircle, ChevronDown, FileText, Calendar, Droplet, ArrowRight, X, Check, Square, CheckSquare, Minus, Layers, Settings, ChevronRight, Beaker, ClipboardList, Zap, Download, Loader2 } from 'lucide-react';

interface DataViewProps {
  data: DeviceData[];
  filters: FilterState;
  sheetNames: string[];
  activeSheet: string;
  onSheetChange: (sheetName: string) => void;
}

// Interface for the generated report items
interface ReportItem {
    uniqueId: string; // unique key for rendering
    data: DeviceData;
    config: {
        source: string;
        otherDetail?: string; // Specific detail if source is 'Other'
        tests: string[];
        reasons: string[];
        equipmentTypes: string[];
    }
}

const DataView: React.FC<DataViewProps> = ({ data, filters, sheetNames, activeSheet, onSheetChange }) => {
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [previewReport, setPreviewReport] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  
  // State to manage interactive checkboxes in reports (Visual only for print)
  const [reportCheckboxes, setReportCheckboxes] = useState<Record<string, Record<string, boolean>>>({});

  // State to manage dates per report item
  const [reportDates, setReportDates] = useState<Record<string, string>>({});

  // State for Table Row Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // --- SAMPLE CONFIGURATION STATE ---
  const [showSampleConfigModal, setShowSampleConfigModal] = useState(false);
  
  // Set for multiple selections
  const [selectedSampleSources, setSelectedSampleSources] = useState<Set<string>>(new Set()); 
  
  // sampleOtherDetail is now a Set for multiple selections
  const [sampleOtherDetails, setSampleOtherDetails] = useState<Set<string>>(new Set());
  
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [selectedReasons, setSelectedReasons] = useState<Set<string>>(new Set());
  const [selectedEquipmentTypes, setSelectedEquipmentTypes] = useState<Set<string>>(new Set());

  // Holds the final processed list of items to print
  const [finalReportItems, setFinalReportItems] = useState<ReportItem[]>([]);

  const availableEquipmentTypes = ["Transformer", "Shunt Reactor", "New Oil", "Load Tapchanger", "Circuit Breaker", "Others"];
  const availableTests = ["Oil Quality Test (OQ)", "Dissolved Gas-in-Oil Analysis (DGA)", "Furanic Compounds", "Corrosive Sulfur", "Passivators"];
  const availableReasons = ["Commissioning", "Investigate", "Warranty", "Failure", "Annual", "Processing Sample #"];
  const availableOtherOptions = ['CBL R', 'CBL Y', 'CBL B', 'CBL N', 'ONE CBL (R-Y-B)', 'OLTC 1', 'OLTC 2', 'OLTC 3'];

  // Get dynamic headers from the first row of data
  const columns = useMemo(() => {
    if (data.length === 0) return [];
    const allKeys = Object.keys(data[0]);
    return allKeys.filter(key => !INTERNAL_KEYS.includes(key));
  }, [data]);

  // Handle selecting a report template
  const handleSelectReport = (reportName: string) => {
    if (reportName === 'نموذج عينات الزيت') {
        setShowPrintMenu(false);
        // Reset defaults
        setSelectedSampleSources(new Set());
        setSampleOtherDetails(new Set());
        setSelectedTests(new Set());
        setSelectedReasons(new Set());
        setSelectedEquipmentTypes(new Set());
        setShowSampleConfigModal(true);
    } else {
        setPreviewReport(reportName);
        setShowPrintMenu(false);
    }
  };

  // Helper Functions for Toggles
  const toggleSetItem = (set: Set<string>, item: string, setFunc: React.Dispatch<React.SetStateAction<Set<string>>>) => {
      setFunc(prev => {
          const newSet = new Set(prev);
          if (newSet.has(item)) newSet.delete(item);
          else newSet.add(item);
          return newSet;
      });
  };

  const toggleSampleSourceSelection = (source: string) => {
      setSelectedSampleSources(prev => {
          const newSet = new Set(prev);
          if (newSet.has(source)) {
              newSet.delete(source);
              if (source === 'Other') setSampleOtherDetails(new Set());
          } else {
              newSet.add(source);
          }
          return newSet;
      });
  };

  // --- APPLY CONFIGURATION AND GENERATE REPORT ITEMS ---
  const applySampleConfigAndPreview = () => {
    const itemsToProcess = selectedIds.size > 0 ? data.filter(d => selectedIds.has(d.id)) : data;
    const generatedReportItems: ReportItem[] = [];

    const hasOQ = selectedTests.has("Oil Quality Test (OQ)");
    const hasDGA = selectedTests.has("Dissolved Gas-in-Oil Analysis (DGA)");
    
    let testBatches: string[][] = [];

    if (hasOQ && hasDGA) {
        testBatches.push(["Oil Quality Test (OQ)"]);
        testBatches.push(["Dissolved Gas-in-Oil Analysis (DGA)"]);
        const remainingTests = (Array.from(selectedTests) as string[]).filter(t => t !== "Oil Quality Test (OQ)" && t !== "Dissolved Gas-in-Oil Analysis (DGA)");
        if (remainingTests.length > 0) testBatches.push(remainingTests);
    } else {
        if (selectedTests.size > 0) testBatches.push(Array.from(selectedTests) as string[]);
    }
    
    const reasonsArray = Array.from(selectedReasons) as string[];
    const equipmentTypesArray = Array.from(selectedEquipmentTypes) as string[];

    itemsToProcess.forEach(item => {
        const addReportsForSource = (source: string, detail?: string) => {
            testBatches.forEach((batchTests, index) => {
                 generatedReportItems.push({
                    uniqueId: `${item.id}-${source}-${detail || ''}-${index}`,
                    data: item,
                    config: {
                        source: source,
                        otherDetail: detail,
                        tests: batchTests,
                        reasons: reasonsArray,
                        equipmentTypes: equipmentTypesArray
                    }
                });
            });
        };

        selectedSampleSources.forEach(source => {
            if (source === 'Other') {
                if (sampleOtherDetails.size > 0) {
                    sampleOtherDetails.forEach(detail => addReportsForSource('Other', detail));
                } else {
                    addReportsForSource('Other');
                }
            } else {
                addReportsForSource(source);
            }
        });
    });

    setFinalReportItems(generatedReportItems);
    setPreviewReport('نموذج عينات الزيت');
    setShowSampleConfigModal(false);
  };

  const closePreview = () => {
    setPreviewReport(null);
    setFinalReportItems([]);
  };

  const executePrint = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Function to Export PDF on Mobile
  const handleExportPDF = () => {
    const element = document.getElementById('report-container');
    if (!element) return;
    
    setIsExporting(true);

    const opt = {
        margin: 0,
        filename: `Oil_Samples_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use html2pdf from global window object
    // @ts-ignore
    if (window.html2pdf) {
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false);
        }).catch((err: any) => {
            console.error("PDF Export Error:", err);
            setIsExporting(false);
            alert("حدث خطأ أثناء تصدير الملف");
        });
    } else {
        alert("مكتبة التصدير غير متوفرة");
        setIsExporting(false);
    }
  };

  // --- SELECTION LOGIC ---
  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
        const newSet = new Set(prev);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === data.length && data.length > 0) {
        setSelectedIds(new Set());
    } else {
        const allIds = data.map(d => d.id);
        setSelectedIds(new Set(allIds));
    }
  };

  const toggleReportCheckbox = (uniqueId: string, label: string) => {
    setReportCheckboxes(prev => {
        const itemState = prev[uniqueId] || {};
        return { ...prev, [uniqueId]: { ...itemState, [label]: !itemState[label] } };
    });
  };

  const updateReportDate = (uniqueId: string, newDate: string) => {
    setReportDates(prev => ({ ...prev, [uniqueId]: newDate }));
  };

  const contextTitle = filters.station ? filters.station : (filters.area ? `منطقة: ${filters.area}` : 'شامل');

  // --- REPORT COMPONENTS (Kept White for Print) ---
  const FormField: React.FC<{ label: string, value?: string | number, className?: string, labelClass?: string }> = ({ label, value, className = "", labelClass = "" }) => (
    <div className={`flex items-end gap-1 mb-1 ${className}`}>
        <span className={`font-bold text-black whitespace-nowrap text-[11px] ${labelClass}`}>{label}</span>
        <div className="border-b border-black flex-grow px-1 font-mono text-blue-900 text-[11px] font-bold min-h-[18px]">
            {value}
        </div>
    </div>
  );

  // UPDATED: InteractiveCheckBox to be print-safe
  const InteractiveCheckBox: React.FC<{ uniqueId: string, label: string, isCheckedOverride?: boolean, className?: string, children?: React.ReactNode }> = ({ uniqueId, label, isCheckedOverride, className = "", children }) => {
      const manualState = reportCheckboxes[uniqueId]?.[label] || false;
      const isChecked = isCheckedOverride !== undefined ? isCheckedOverride : manualState;
      return (
          <div 
              className={`flex items-center gap-1 mb-0.5 cursor-pointer group ${className}`}
              onClick={() => isCheckedOverride === undefined && toggleReportCheckbox(uniqueId, label)}
          >
              <div className={`w-3.5 h-3.5 border border-black flex-shrink-0 flex items-center justify-center transition-colors ${isChecked ? 'bg-black print:bg-white' : 'bg-white'}`}>
                  {isChecked && <Check size={12} className="text-white print:text-black font-bold" strokeWidth={4} />}
              </div>
              <span className="text-black font-semibold text-[10px] leading-tight group-hover:text-primary transition-colors">{label}</span>
              {children}
          </div>
      );
  };

  const SingleForm: React.FC<{ reportItem: ReportItem }> = ({ reportItem }) => {
      const { data: item, config, uniqueId } = reportItem;
      const currentDate = reportDates[uniqueId] || new Date().toISOString().split('T')[0];

      // Helper to match flexible column names
      const findField = (keywords: string[]) => {
           const dataKeys = Object.keys(item);
           for (const kw of keywords) {
               const exactKey = dataKeys.find(k => k.trim().toLowerCase() === kw.toLowerCase());
               if (exactKey && item[exactKey] !== undefined && item[exactKey] !== '') return item[exactKey];
           }
           for (const kw of keywords) {
               const partialKey = dataKeys.find(k => k.toLowerCase().includes(kw.toLowerCase()));
               if (partialKey && item[partialKey] !== undefined && item[partialKey] !== '') return item[partialKey];
           }
           return '';
      };

      const valSubstation = findField(['Substation', 'Station Name', 'Station', 'Location', 'Site']) || item.stationName;
      const valArea = findField(['Area', 'Division', 'Zone', 'Region']) || item.areaName;
      const valDispatch = findField(['Dispatch No', 'Dispatch', 'Transformer number', 'Equipment Ref', 'SAP No', 'SAP']);
      const valSerial = findField(['Serial Number', 'Serial No', 'S.N', 'Serial', 'S/N']);
      const valManufacturer = findField(['Manufacturer', 'Make', 'Brand']);
      const valYear = findField(['Year of Manufacture', 'Year', 'YOM', 'Mnf Year', 'Date of Manufacture']);
      const valMVA = findField(['Rating (MVA)', 'MVA', 'Rating', 'Power', 'Capacity']);
      const valKV = findField(['Voltage level', 'KV', 'Voltage', 'Volts']);

      // Hardcoded white background class for print
      // Adjusted height from 140mm to 135mm to better fit A4 (2 per page)
      return (
          <div className="print-force-white border-2 border-black p-3 h-[135mm] relative flex flex-col bg-white box-border mb-4 break-inside-avoid text-left" dir="ltr">
               <div className="flex justify-between items-end mb-2 border-b-2 border-black pb-2 shrink-0">
                  <div className="text-left">
                      <h3 className="text-gray-600 font-serif text-xs font-bold">Central Labs - Dammam</h3>
                  </div>
                  <div className="text-right">
                      <h3 className="font-bold text-base font-serif text-black">National Grid sa</h3>
                      <h4 className="text-right text-sm font-arabic font-bold text-black">نقل الكهرباء</h4>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6 h-full flex-grow text-left">
                  {/* LEFT COLUMN: EQUIPMENT DATA */}
                  <div className="border-r border-gray-300 pr-3 flex flex-col justify-between">
                      <div>
                          <h1 className="text-center text-sm font-bold uppercase underline mb-3 tracking-wide font-serif text-black">EQUIPMENT DATA</h1>
                          
                          <FormField label="SUBSTATION NAME :" value={valSubstation} />
                          <FormField label="AREA :" value={valArea} />

                          <div className="mt-2 mb-2">
                              <span className="font-bold text-[11px] block mb-1">EQUIPMENT TYPE :</span>
                              <div className="grid grid-cols-2 gap-y-1 gap-x-2 ml-2">
                                  {availableEquipmentTypes.map(t => (
                                     <InteractiveCheckBox key={t} uniqueId={uniqueId} label={t} isCheckedOverride={config.equipmentTypes.includes(t)} />
                                  ))}
                              </div>
                          </div>

                          <FormField label="Dispatch No:" value={valDispatch} className="mt-2" />
                          <FormField label="Serial Number" value={valSerial} />
                          <FormField label="Manufacturer :" value={valManufacturer} />
                          <FormField label="Year Manufacture :" value={valYear} />
                          <FormField label="Sample Temp :" value="" />
                          
                          <div className="flex gap-2 items-end mb-1 mt-1">
                              <div className="flex items-end gap-1 flex-1">
                                  <span className="font-bold text-[11px] whitespace-nowrap">Rating :</span>
                                  <div className="border-b border-black px-1 flex-grow min-w-[30px] text-center font-mono text-blue-900 text-[11px] font-bold">{valMVA}</div>
                                  <span className="font-bold text-[11px]">MVA</span>
                              </div>
                              <div className="flex items-end gap-1 flex-1">
                                  <div className="border-b border-black px-1 flex-grow min-w-[30px] text-center font-mono text-blue-900 text-[11px] font-bold">{valKV}</div>
                                  <span className="font-bold text-[11px]">KV</span>
                              </div>
                          </div>
                          <FormField label="COMMENTS :" value="" />
                      </div>
                      
                      <div className="mt-2 pt-1 border-t border-gray-200">
                          <h3 className="font-bold text-[11px] mb-1">RESULTS SEND TO :</h3>
                          <div className="grid grid-cols-1 gap-0">
                              <FormField label="Name:" value="Mohammed Shaban" />
                              <FormField label="E-mail :" value="2551578004" />
                              <FormField label="Phone/Mobile :" value="" />
                          </div>
                      </div>
                  </div>

                  {/* RIGHT COLUMN: SAMPLE DATA */}
                  <div className="pl-1 flex flex-col justify-between">
                      <div>
                          <h1 className="text-center text-sm font-bold uppercase underline mb-3 tracking-wide font-serif text-black">INSULATING OIL SAMPLE</h1>
                          <div className="flex gap-2">
                              <div className="flex items-end gap-1 mb-1 flex-1">
                                  <span className="font-bold text-black whitespace-nowrap text-[11px]">DATE :</span>
                                  <div className="border-b border-black flex-grow min-h-[18px]">
                                      <input type="date" value={currentDate} onChange={(e) => updateReportDate(uniqueId, e.target.value)} className="w-full bg-transparent font-mono text-blue-900 text-[11px] font-bold outline-none h-full cursor-pointer p-0" />
                                  </div>
                              </div>
                              <FormField label="TIME :" value="" className="flex-1" />
                          </div>
                          <FormField label="SAMPLE DRAWN BY :" value="" />
                          <div className="flex gap-2">
                            <FormField label="ID :" value="" className="flex-1" />
                            <FormField label="TEL/MOB :" value="" className="flex-1" />
                          </div>

                          <div className="mt-3 mb-3">
                              <span className="font-bold text-[11px] mb-1 block">SAMPLE TAKEN FROM:</span>
                              <div className="flex justify-between gap-2 flex-wrap">
                                  <InteractiveCheckBox uniqueId={uniqueId} label="Main Tank Bottom" isCheckedOverride={config.source === 'Main Tank Bottom'} />
                                  <InteractiveCheckBox uniqueId={uniqueId} label="Main Tank Top" isCheckedOverride={config.source === 'Main Tank Top'} />
                                  <InteractiveCheckBox uniqueId={uniqueId} label="Other" isCheckedOverride={config.source === 'Other'} />
                              </div>
                          </div>

                          <div className="flex gap-2 mt-3 items-start">
                              <div className="flex-1">
                                  <span className="font-bold text-[11px] mb-1 block">TEST REQUIRED :</span>
                                  <div className="ml-1 space-y-1.5">
                                      {availableTests.map(t => <InteractiveCheckBox key={t} uniqueId={uniqueId} label={t} isCheckedOverride={config.tests.includes(t)} />)}
                                  </div>
                              </div>
                              <div className="flex-1 pt-1">
                                  {config.source === 'Other' && config.otherDetail && (
                                      <div className="grid grid-cols-2 gap-x-1 gap-y-1">
                                          {availableOtherOptions.map((opt) => <InteractiveCheckBox key={opt} uniqueId={uniqueId} label={opt} isCheckedOverride={opt === config.otherDetail} />)}
                                      </div>
                                  )}
                              </div>
                          </div>
                          <FormField label="OTHERS :" value="" className="mt-3" />
                      </div>
                      <div className="mt-2">
                          <span className="font-bold text-[11px] mb-1 block">REASON FOR TEST:</span>
                          <div className="ml-1 grid grid-cols-2 gap-y-1.5">
                              {availableReasons.map(r => 
                                r === "Processing Sample #" ? 
                                <InteractiveCheckBox key={r} uniqueId={uniqueId} label="Processing Sample #" isCheckedOverride={config.reasons.includes(r)} className="col-span-2"><div className="border-b border-black flex-grow min-w-[30px] ml-1"></div></InteractiveCheckBox> :
                                <InteractiveCheckBox key={r} uniqueId={uniqueId} label={r} isCheckedOverride={config.reasons.includes(r)} />
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      );
  };

  // --- RENDER LOGIC ---

  if (previewReport === 'نموذج عينات الزيت') {
    const pages: ReportItem[][] = [];
    for (let i = 0; i < finalReportItems.length; i += 2) pages.push(finalReportItems.slice(i, i + 2));

    return (
        // Key change: print attributes to breakout of fixed/scroll container
        <div className="fixed inset-0 z-[100] bg-gray-600/90 dark:bg-slate-900/90 overflow-y-auto backdrop-blur-sm print:absolute print:inset-0 print:z-[10000] print:bg-white print:h-auto print:w-full print:overflow-visible">
            <div className="sticky top-0 left-0 right-0 bg-white dark:bg-slate-800 shadow-md z-50 px-6 py-4 flex justify-between items-center print:hidden border-b dark:border-slate-700">
                <div dir="rtl">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Droplet size={24} className="text-primary" />
                        معاينة: نموذج عينات الزيت
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        جاهز للطباعة ({finalReportItems.length} نموذج - {pages.length} صفحة)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    
                    {/* Desktop Button: Print */}
                    <button 
                        onClick={executePrint} 
                        className="hidden md:flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg font-bold hover:bg-teal-700 transition shadow-lg"
                    >
                        <Printer size={18} />
                        طباعة
                    </button>

                    {/* Mobile Button: Export PDF */}
                    <button 
                        onClick={handleExportPDF} 
                        disabled={isExporting}
                        className="flex md:hidden items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-700 transition shadow-lg disabled:opacity-50"
                    >
                        {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                        {isExporting ? 'جاري التصدير...' : 'تصدير PDF'}
                    </button>

                    <button onClick={closePreview} className="flex items-center gap-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-200 px-6 py-2 rounded-lg font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition border border-gray-300 dark:border-slate-600">
                        <X size={18} />
                        إغلاق
                    </button>
                </div>
            </div>

            <div id="report-container" className="w-[210mm] mx-auto bg-white my-8 shadow-2xl print:shadow-none print:m-0 print:w-full print:bg-white">
                {pages.map((pageItems, pageIndex) => (
                    // Key Change: Reduce print padding to fit 2 items + break-after-page
                    <div key={pageIndex} className="w-full h-[297mm] p-[10mm] flex flex-col justify-between bg-white print:bg-white print:p-[5mm] print:break-after-page relative">
                        {pageItems.map((reportItem) => <SingleForm key={reportItem.uniqueId} reportItem={reportItem} />)}
                    </div>
                ))}
            </div>
            
            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { background-color: white !important; }
                    .print\\:hidden { display: none !important; }
                    .print\\:bg-white { background-color: white !important; }
                    .print\\:text-black { color: black !important; }
                    
                    /* Hide everything else */
                    body > *:not(#root) { display: none; }
                }
            `}</style>
        </div>
    );
  }

  // MAIN VIEW
  return (
    <div className="w-full pb-20 px-4 md:px-8 py-6">
         {/* --- CONFIGURATION MODAL --- */}
         {showSampleConfigModal && (
             <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                 <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border dark:border-slate-700">
                     <div className="bg-primary text-white p-4 flex justify-between items-center shrink-0">
                         <h3 className="font-bold text-lg flex items-center gap-2">
                             <Settings size={20} />
                             إعدادات العينة (Configuration)
                         </h3>
                         <button onClick={() => setShowSampleConfigModal(false)} className="hover:bg-white/20 p-1 rounded-full transition"><X size={20} /></button>
                     </div>
                     
                     <div className="p-6 overflow-y-auto text-gray-800 dark:text-gray-100">
                         <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm font-semibold">
                             سيتم تطبيق هذه الإعدادات على {selectedIds.size > 0 ? selectedIds.size : data.length} جهاز.
                         </p>

                         {/* 1. EQUIPMENT TYPE */}
                         <div className="mb-6">
                             <h4 className="font-bold mb-3 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                                 <Zap size={18} className="text-purple-600 dark:text-purple-400" />
                                 1. نوع المعدة <span className="text-xs text-gray-400 font-normal">(اختياري)</span>
                             </h4>
                             <div className="grid grid-cols-2 gap-2">
                                 {availableEquipmentTypes.map((type) => {
                                     const isSelected = selectedEquipmentTypes.has(type);
                                     return (
                                         <label key={type} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-400 dark:border-purple-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-purple-600 border-purple-600' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-500'}`}>
                                                 {isSelected && <Check size={14} className="text-white" />}
                                             </div>
                                             <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSetItem(selectedEquipmentTypes, type, setSelectedEquipmentTypes)} />
                                             <span className={`mr-3 text-sm font-semibold ${isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-700 dark:text-gray-300'}`}>{type}</span>
                                         </label>
                                     );
                                 })}
                             </div>
                         </div>
                         
                         {/* 2. SAMPLE SOURCE */}
                         <div className="mb-6">
                             <h4 className="font-bold mb-3 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                                 <Droplet size={18} className="text-amber-500" />
                                 2. مكان أخذ العينة <span className="text-red-500">*</span>
                             </h4>
                             <div className="space-y-3">
                                 {['Main Tank Bottom', 'Main Tank Top', 'Other'].map(src => {
                                     const isSelected = selectedSampleSources.has(src);
                                     const isOther = src === 'Other';
                                     return (
                                     <div key={src} className={`${isOther ? `border rounded-lg transition-all overflow-hidden ${isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-200 dark:border-slate-600'}` : ''}`}>
                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${!isOther && isSelected ? 'border-primary bg-primary/5 dark:bg-primary/10 ring-1 ring-primary' : !isOther ? 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500' : 'border-none'}`}>
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-primary border-primary' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-500'}`}>
                                                {isSelected && <Check size={14} className="text-white" />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSampleSourceSelection(src)} />
                                            <span className="mr-3 font-bold text-gray-800 dark:text-gray-200">{src === 'Other' ? 'Other (أخرى)' : src}</span>
                                        </label>
                                        
                                        {isOther && isSelected && (
                                            <div className="px-4 pb-4 mr-8 border-t border-primary/20 pt-3">
                                                <div className="grid grid-cols-2 gap-2">
                                                    {availableOtherOptions.map((opt) => {
                                                        const isChecked = sampleOtherDetails.has(opt);
                                                        return (
                                                            <label key={opt} className={`flex items-center p-2 rounded cursor-pointer text-sm transition-all border ${isChecked ? 'bg-primary text-white border-primary shadow-sm' : 'bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-600 border-gray-200 dark:border-slate-500'}`}>
                                                                <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center shrink-0 ${isChecked ? 'border-white bg-transparent' : 'border-gray-400 dark:border-gray-500 bg-white dark:bg-slate-600'}`}>
                                                                    {isChecked && <Check size={12} className="text-white" />}
                                                                </div>
                                                                <input type="checkbox" checked={isChecked} onChange={() => toggleSetItem(sampleOtherDetails, opt, setSampleOtherDetails)} className="hidden" />
                                                                {opt}
                                                            </label>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                     </div>
                                 )})}
                             </div>
                         </div>

                         {/* 3. TEST REQUIRED */}
                         <div>
                             <h4 className="font-bold mb-3 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                                 <Beaker size={18} className="text-blue-500" />
                                 3. الفحوصات المطلوبة <span className="text-red-500">*</span>
                             </h4>
                             <div className="grid grid-cols-1 gap-2">
                                 {availableTests.map((test) => {
                                     const isSelected = selectedTests.has(test);
                                     return (
                                         <label key={test} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-400 dark:border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-500'}`}>
                                                 {isSelected && <Check size={14} className="text-white" />}
                                             </div>
                                             <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSetItem(selectedTests, test, setSelectedTests)} />
                                             <span className={`mr-3 text-sm font-semibold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-700 dark:text-gray-300'}`}>{test}</span>
                                         </label>
                                     );
                                 })}
                             </div>
                         </div>

                        {/* 4. REASON */}
                        <div className="mt-6">
                             <h4 className="font-bold mb-3 flex items-center gap-2 border-b dark:border-slate-700 pb-2">
                                 <ClipboardList size={18} className="text-green-600 dark:text-green-400" />
                                 4. سبب الفحص
                             </h4>
                             <div className="grid grid-cols-2 gap-2">
                                 {availableReasons.map((reason) => {
                                     const isSelected = selectedReasons.has(reason);
                                     return (
                                         <label key={reason} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${isSelected ? 'bg-green-50 dark:bg-green-900/30 border-green-400 dark:border-green-500' : 'hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-600'}`}>
                                             <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors shrink-0 ${isSelected ? 'bg-green-600 border-green-600' : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-500'}`}>
                                                 {isSelected && <Check size={14} className="text-white" />}
                                             </div>
                                             <input type="checkbox" className="hidden" checked={isSelected} onChange={() => toggleSetItem(selectedReasons, reason, setSelectedReasons)} />
                                             <span className={`mr-3 text-sm font-semibold ${isSelected ? 'text-green-900 dark:text-green-100' : 'text-gray-700 dark:text-gray-300'}`}>{reason}</span>
                                         </label>
                                     );
                                 })}
                             </div>
                         </div>
                     </div>
                     
                     <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex justify-end gap-3 shrink-0">
                         <button onClick={() => setShowSampleConfigModal(false)} className="px-4 py-2 text-gray-600 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-slate-700 rounded-lg transition">إلغاء</button>
                         <button onClick={applySampleConfigAndPreview} disabled={selectedSampleSources.size === 0 || (selectedSampleSources.has('Other') && sampleOtherDetails.size === 0) || selectedTests.size === 0} className="px-6 py-2 bg-primary text-white font-bold rounded-lg shadow hover:bg-teal-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">عرض النموذج <ChevronRight size={16} className="rotate-180" /></button>
                     </div>
                 </div>
             </div>
         )}

      {/* --- HEADER CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">تفاصيل البيانات</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">عرض {data.length} سجل - {contextTitle}</p>
          {selectedIds.size > 0 && (
             <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full text-xs font-bold border border-amber-200 dark:border-amber-800">
                <CheckSquare size={14} /> تم تحديد {selectedIds.size} عنصر
             </div>
          )}
        </div>
        
        <div className="relative w-full md:w-auto">
          <button type="button" onClick={() => setShowPrintMenu(!showPrintMenu)} className="w-full md:w-auto flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl hover:bg-teal-800 transition shadow-lg shadow-primary/20">
            <Printer size={18} /> طباعة نماذج <ChevronDown size={16} className={`transition-transform duration-200 ${showPrintMenu ? 'rotate-180' : ''}`} />
          </button>
          {showPrintMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowPrintMenu(false)}></div>
              <div className="absolute left-0 mt-2 w-full md:w-64 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-100 dark:border-slate-700 z-20 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                <div className="p-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">اختر النموذج</div>
                <button type="button" onClick={() => handleSelectReport('نموذج عينات الزيت')} className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-700 dark:text-gray-200 transition border-b border-gray-50 dark:border-slate-700">
                  <Droplet size={16} className="text-amber-500" /> نموذج عينات الزيت
                  {selectedIds.size > 0 && <span className="mr-auto text-xs bg-gray-200 dark:bg-slate-600 px-2 rounded-full text-gray-600 dark:text-gray-300">{selectedIds.size}</span>}
                </button>
                <div className="border-t border-gray-100 dark:border-slate-700 mt-1 pt-1">
                   <button type="button" onClick={() => handleSelectReport('')} className="w-full text-right px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 transition"><ArrowRight size={16} /> طباعة الجدول الحالي</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* --- SHEET TABS --- */}
      {sheetNames.length > 0 && (
        <div className="mb-6 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 ml-4 font-bold text-sm shrink-0"><Layers size={18} /> أوراق العمل:</div>
                {sheetNames.map(sheet => (
                    <button key={sheet} onClick={() => onSheetChange(sheet)} className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border flex items-center gap-2 ${activeSheet === sheet ? 'bg-primary text-white border-primary shadow-md' : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-primary'}`}>
                        {sheet} {activeSheet === sheet && <div className="w-1.5 h-1.5 rounded-full bg-white/50" />}
                    </button>
                ))}
            </div>
        </div>
      )}

      {/* --- DATA TABLE --- */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden flex-1 flex flex-col min-h-[500px]">
        <div className="overflow-x-auto overflow-y-auto h-full scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-slate-600">
          {data.length > 0 ? (
          <table className="w-full text-right border-collapse relative min-w-[1000px]">
            <thead className="bg-gray-50 dark:bg-slate-900 text-gray-700 dark:text-gray-300 font-bold border-b border-gray-200 dark:border-slate-700 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="p-4 w-12 text-center bg-gray-50 dark:bg-slate-900 sticky right-0 z-20 border-l border-gray-200 dark:border-slate-700">
                    <button type="button" onClick={toggleSelectAll} className="flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-primary transition">
                         {selectedIds.size === 0 ? <Square size={20} /> : selectedIds.size === data.length ? <CheckSquare size={20} className="text-primary" /> : <Minus size={20} className="text-primary" />}
                    </button>
                </th>
                <th className="p-4 w-12 text-center bg-gray-50 dark:bg-slate-900 border-l border-gray-100 dark:border-slate-700">#</th>
                {columns.map((col) => <th key={col} className="p-4 whitespace-nowrap min-w-[150px] border-l border-gray-100 dark:border-slate-700 last:border-l-0">{col}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
              {data.map((row, index) => {
                const isSelected = selectedIds.has(row.id);
                return (
                <tr key={row.id} className={`transition group ${isSelected ? 'bg-blue-50/60 dark:bg-blue-900/20 hover:bg-blue-50 dark:hover:bg-blue-900/30' : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'}`}>
                  <td className="p-4 text-center sticky right-0 z-10 border-l border-gray-100 dark:border-slate-700 bg-inherit backdrop-blur-sm">
                     <button type="button" onClick={() => toggleSelection(row.id)} className="flex items-center justify-center text-gray-400 dark:text-slate-500 hover:text-primary transition">
                         {isSelected ? <CheckSquare size={20} className="text-primary" /> : <Square size={20} />}
                     </button>
                  </td>
                  <td className="p-4 text-center text-gray-400 dark:text-slate-500 font-mono border-l border-gray-100 dark:border-slate-700">{index + 1}</td>
                  {columns.map((col) => <td key={`${row.id}-${col}`} className="p-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300 border-l border-gray-100 dark:border-slate-700 last:border-l-0">{row[col] !== undefined && row[col] !== null ? String(row[col]) : '-'}</td>)}
                </tr>
              )})}
            </tbody>
          </table>
          ) : (
             <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400 p-10">
                <AlertCircle size={32} className="text-gray-300 dark:text-slate-600 mb-2" />
                <p>الورقة المختارة فارغة</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataView;