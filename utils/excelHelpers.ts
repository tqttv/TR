import * as XLSX from 'xlsx';
import { DeviceData } from '../types';

/**
 * Parses a standard JavaScript Date object to YYYY-MM-DD string
 * If parsing fails, returns the original input.
 */
export const formatDate = (dateInput: any): any => {
  if (dateInput === null || dateInput === undefined || dateInput === '') return '';
  
  // Handle Excel serial date numbers (e.g., 44500)
  if (typeof dateInput === 'number') {
    // Excel dates start from Dec 30, 1899. 
    // If number is too small (e.g. just a regular number like "5"), don't treat as date.
    if (dateInput < 10000) return dateInput; 

    const date = new Date(Math.round((dateInput - 25569) * 86400 * 1000));
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : dateInput;
  }
  
  // Handle string or Date objects
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return dateInput; // Return original if not a valid date
  
  // Check if the original input looks like a date string to avoid converting random text
  const asString = String(dateInput);
  if (asString.length < 6) return dateInput;

  return date.toISOString().split('T')[0];
};

/**
 * Transforms raw Excel JSON into our typed structure.
 * IMPORTS ALL COLUMNS EXACTLY AS THEY ARE.
 */
export const processExcelData = (rawData: any[]): DeviceData[] => {
  if (!rawData || rawData.length === 0) return [];

  // 1. Get all available keys from the first row to identify columns
  const firstRowKeys = Object.keys(rawData[0]);
  
  // Helper to find specific internal columns (Partial match allowed now)
  const findKeyLike = (keys: string[], target: string) => {
    const cleanTarget = target.toLowerCase();
    return keys.find(k => k.toLowerCase().includes(cleanTarget));
  };

  // 2. Identify Keys for Sidebar Filtering (Station & Area)
  // STATION KEYS MAPPING
  let stationKey = firstRowKeys.find(k => k.trim().toLowerCase() === 'substation') || 
                   findKeyLike(firstRowKeys, 'substation') || 
                   firstRowKeys.find(k => k.trim().toLowerCase() === 'location') || 
                   findKeyLike(firstRowKeys, 'location') ||
                   findKeyLike(firstRowKeys, 'station') ||
                   findKeyLike(firstRowKeys, 'site') ||
                   findKeyLike(firstRowKeys, 'ss name') || 
                   firstRowKeys.find(k => k.includes('المحطة'));

  // AREA KEYS MAPPING
  let areaKey = firstRowKeys.find(k => k.trim().toLowerCase() === 'area') || 
                findKeyLike(firstRowKeys, 'area') || 
                firstRowKeys.find(k => k.trim().toLowerCase() === 'division') ||
                findKeyLike(firstRowKeys, 'division') ||
                firstRowKeys.find(k => k.includes('المنطقة'));

  // 3. Process every row
  return rawData.map((row, index) => {
    // --- A. Extract Metadata for Filtering (Sidebar) ---
    let stationName = 'غير محدد';
    let areaName = '';

    if (stationKey && row[stationKey] !== undefined) {
        const val = String(row[stationKey]).trim();
        if (val && 
            val.toLowerCase() !== 'substation' && 
            val.toLowerCase() !== 'location' && 
            val.toLowerCase() !== 'division' &&
            val.toLowerCase() !== 'area' &&
            val.toLowerCase() !== 'null') {
            stationName = val;
        }
    }

    if (areaKey && row[areaKey] !== undefined) {
        const val = String(row[areaKey]).trim();
        if (val && 
            val.toLowerCase() !== 'null' && 
            val.toLowerCase() !== 'division' && 
            val.toLowerCase() !== 'area') {
            areaName = val;
        }
    }

    // --- B. Process Columns ---
    const processedRow: any = {};
    const rowKeys = Object.keys(row);
    
    for (const key of rowKeys) {
        const keysToRemove = [
            '__EMPTY', '__EMPTY_1', '__EMPTY_2',       
            '__EMPTY_3', '__EMPTY_4', '__EMPTY_5', '__EMPTY_6', '__EMPTY_7' 
        ];
        
        if (keysToRemove.includes(key)) {
            continue;
        }

        const value = row[key];
        
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('تاريخ')) {
             processedRow[key] = formatDate(value);
        } else {
             processedRow[key] = value;
        }
    }

    return {
      id: `row-${index}-${Math.random().toString(36).substr(2, 9)}`,
      stationName, 
      areaName,    
      ...processedRow 
    };
  });
};

/**
 * دالة توليد البيانات الافتراضية
 * تم تحديثها لترجع كائن يحتوي على جميع الأوراق (Sheets)
 */
export const generateMockData = (): Record<string, DeviceData[]> => {
  
  const rawData: Record<string, any[]> = {
    "Substations Name": [
        { "SS NAME": "JCPS-1", "SS ID": "JZ-640A", "Energised date ": 1986 },
        { "SS NAME": "Darb", "SS ID": "SQ-6408", "Energised date ": 1996 },
        { "SS NAME": "JCPS-2", "SS ID": "JZ-640B", "Energised date ": 2007 },
        { "SS NAME": "Shuqaiq1", "SS ID": "SQ-8425", "Energised date ": 2010 },
        { "SS NAME": "J.South", "SS ID": "JZ-6402", "Energised date ": 1991 },
        { "SS NAME": "Shuqaiq2", "SS ID": "SQ-8434", "Energised date ": 2016 },
        { "SS NAME": "Sabya", "SS ID": "JZ-6403", "Energised date ": 1991 },
        { "SS NAME": "A.SADAD", "SS ID": "SQ-6435", "Energised date ": 2016 },
        { "SS NAME": "Baish", "SS ID": "JZ-6404", "Energised date ": 1991 },
        { "SS NAME": "Shuqaiq3", "SS ID": "SQ-8444", "Energised date ": 2021 },
        { "SS NAME": "Al Haqu", "SS ID": "JZ-6405", "Energised date ": 1995 },
        { "SS NAME": "Heredah", "SS ID": "SQ-6445", "Energised date ": 2021 },
        { "SS NAME": "Ayban", "SS ID": "JZ-6406", "Energised date ": 1986 },
        { "SS NAME": "DHP-1", "SS ID": "JZ-6451", "Energised date ": 2024 },
        { "SS NAME": "Dayer", "SS ID": "JZ-6407", "Energised date ": 1986 },
        { "SS NAME": "Zarqa", "SS ID": "JZ-6409", "Energised date ": 2005 },
        { "SS NAME": "A.Arish", "SS ID": "JZ-6410", "Energised date ": 1991 },
        { "SS NAME": "SAMITAH", "SS ID": "JZ-6412", "Energised date ": 1991 },
        { "SS NAME": "Al Ahad", "SS ID": "JZ-6413", "Energised date ": 2007 },
        { "SS NAME": "Salama", "SS ID": "JZ-6422", "Energised date ": 2007 },
        { "SS NAME": "KFH", "SS ID": "JZ-6423", "Energised date ": 2009 },
        { "SS NAME": "J. North", "SS ID": "JZ-6424", "Energised date ": 2009 },
        { "SS NAME": "KUDMI", "SS ID": "JZ-8426", "Energised date ": 2010 },
        { "SS NAME": "Atuwal", "SS ID": "JZ-6427", "Energised date ": 2011 },
        { "SS NAME": "JEC", "SS ID": "JZ-8428", "Energised date ": 2011 },
        { "SS NAME": "JIC", "SS ID": "JZ-6429", "Energised date ": 2012 },
        { "SS NAME": "Iskan", "SS ID": "JZ-6430", "Energised date ": 2014 },
        { "SS NAME": "A.Alqaed", "SS ID": "JZ-6431", "Energised date ": 2015 },
        { "SS NAME": "JUS", "SS ID": "JZ-6432", "Energised date ": 2015 },
        { "SS NAME": "Medical", "SS ID": "JZ-6433", "Energised date ": 2016 },
        { "SS NAME": "Mokhtara", "SS ID": "JZ-6436", "Energised date ": 2016 },
        { "SS NAME": "Madhaya", "SS ID": "JZ-8437", "Energised date ": 2017 },
        { "SS NAME": "AlKhishel", "SS ID": "JZ-6438", "Energised date ": 2017 },
        { "SS NAME": "JCC1", "SS ID": "JZ-6439", "Energised date ": 2018 },
        { "SS NAME": "Al Aridha", "SS ID": "JZ-6440", "Energised date ": 2019 },
        { "SS NAME": "JRP", "SS ID": "JZ-8441", "Energised date ": 2019 },
        { "SS NAME": "JEC PHASE-1", "SS ID": "JZ-6442", "Energised date ": 2020 },
        { "SS NAME": "Sabya West", "SS ID": "JZ-6443", "Energised date ": 2021 },
        { "SS NAME": "RC", "SS ID": "JZ-6446", "Energised date ": 2021 },
        { "SS NAME": "Baish West", "SS ID": "JZ-6447", "Energised date ": 2021 },
        { "SS NAME": "JC2", "SS ID": "JZ-6448", "Energised date ": 2022 },
        { "SS NAME": "PORT", "SS ID": "JZ-6449", "Energised date ": 2022 },
        { "SS NAME": "ASEELAH", "SS ID": "JZ-8450", "Energised date ": 2023 },
        { "SS NAME": "ZARQA2", "SS ID": "JZ-6452", "Energised date ": 2024 },
        { "SS NAME": "Abuarish2", "SS ID": "JZ-6453", "Energised date ": 2024 },
        { "SS NAME": "Madhaya BESS", "SS ID": "JZ-8454", "Energised date ": 2025 }
    ],
    "Assets Data": [
        { "Substation": "Jizan South", "Location": "JZ-6402-TR3-AUXTR_T301", "Description": "Auxiliary Transformer 013.8 kV_T301", "Asset": "NG3000065746", "Equipment Number": "3000829004", "Cost Center": "330241111", "Asset Type (Object Type)": "AUXILIARY_TRAFO", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR3-AUXTR_T302", "Description": "Auxiliary Transformer 013.8 kV_T302", "Asset": "NG3000065747", "Equipment Number": "3000829006", "Cost Center": "330241111", "Asset Type (Object Type)": "AUXILIARY_TRAFO", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR4-AUXTR_T401", "Description": "Auxiliary Transformer 034.5 kV_T401", "Asset": "NG3000065748", "Equipment Number": "3000829008", "Cost Center": "330241111", "Asset Type (Object Type)": "AUXILIARY_TRAFO", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR4-AUXTR_T402", "Description": "Auxiliary Transformer 034.5 kV_T402", "Asset": "NG3000065749", "Equipment Number": "3000829010", "Cost Center": "330241111", "Asset Type (Object Type)": "AUXILIARY_TRAFO", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR6-POWERTR_T601", "Description": "Power Transformer 132 kV_T601", "Asset": "NG3000065750", "Equipment Number": "3000829012", "Cost Center": "330241111", "Asset Type (Object Type)": "POWER_TRAFO_6", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR6-POWERTR_T602", "Description": "Power Transformer 132 KV_T602", "Asset": "NG3000065751", "Equipment Number": "3000829016", "Cost Center": "330241111", "Asset Type (Object Type)": "POWER_TRAFO_6", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR6-POWERTR_T603", "Description": "Power Transformer 132 kV_T603", "Asset": "NG3000065752", "Equipment Number": "3000829020", "Cost Center": "330241111", "Asset Type (Object Type)": "POWER_TRAFO_6", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Location": "JZ-6402-TR6-POWERTR_T604", "Description": "Power Transformer 132 kV_T604", "Asset": "NG3000065753", "Equipment Number": "3000829024", "Cost Center": "330241111", "Asset Type (Object Type)": "POWER_TRAFO_6", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Substation": "Sbyan North", "Location": "JZ-6403-TR3-AUXTR_T301", "Description": "Auxiliary Transformer 013.8 kV_T301", "Asset": "NG3000065967", "Equipment Number": "3000830586", "Cost Center": "330241111", "Asset Type (Object Type)": "AUXILIARY_TRAFO", "Linear": "N", "Classification": "POWERTRF", "Status": "ACTIVE" },
        { "Substation": "KUDMI", "Location": "JZ-8426-SR8-RCT_Z801", "Description": "Shunt Reactor 380 kV_Z801", "Asset": "NG3000069651", "Equipment Number": "3000846850", "Cost Center": "330241111", "Asset Type (Object Type)": "SHUNT_REACTOR", "Linear": "N", "Status": "ACTIVE" }
    ],
    "Power Transformer": [
        { "#": 1, "Region": "SOA", "Area": "Jizan", "Substation": "Abu Alqaeed", "Code": "6431_SOA", "Transformer number": "T601", "Serial Number": 318042, "Manufacturer": "Alstom-TURKEY", "Vector Group": "YNyn0d1", "Manufacture Year": 2013, "System Voltage": 132, "KV Levels": "132/33", "MVA": 133, "Terminals (HV/LV)": "Oil cable / Air cable" },
        { "#": 2, "Region": "SOA", "Area": "Jizan", "Substation": "Abu Alqaeed", "Code": "6431_SOA", "Transformer number": "T602", "Serial Number": 318043, "Manufacturer": "Alstom-TURKEY", "Vector Group": "YNyn0d1", "Manufacture Year": 2013, "System Voltage": 132, "KV Levels": "132/33", "MVA": 133, "Terminals (HV/LV)": "Oil cable / Air cable" },
        { "#": 3, "Region": "SOA", "Area": "JIZAN", "Substation": "Abu Arish 2", "Code": "6453_SOA", "Transformer number": "T601", "Serial Number": "1ZTR160901", "Manufacturer": "ABB", "Vector Group": "Dyn1", "Manufacture Year": "2021", "System Voltage": 132, "KV Levels": "132/13.8", "MVA": "67", "Terminals (HV/LV)": "Air bushing /Air cable" },
        { "#": 6, "Region": "SOA", "Area": "Jizan", "Substation": "Abu Arish South", "Code": "6410_SOA", "Transformer number": "T601", "Serial Number": 9041517, "Manufacturer": "Pauwels", "Vector Group": "YNyn0(d1)", "Manufacture Year": 1984, "System Voltage": 132, "KV Levels": "132/33", "MVA": 133, "Terminals (HV/LV)": "Oil cable / Air cable" },
        { "#": 8, "Region": "SOA", "Area": "JIZAN", "Substation": "Abu Sadad", "Code": "6435_SOA", "Transformer number": "T601", "Serial Number": 64003, "Manufacturer": "BEST", "Vector Group": "Dyn1", "Manufacture Year": "2013", "System Voltage": "132", "KV Levels": "132/13.8", "MVA": 67, "Terminals (HV/LV)": "Oil cable / Air cable" },
        { "#": 14, "Region": "SOA", "Area": "Jizan", "Substation": "Addayir", "Code": "6407_SOA", "Transformer number": "T601", "Serial Number": 317377, "Manufacturer": "Areva-TURKEY", "Vector Group": "YNyn0d1", "Manufacture Year": 2009, "System Voltage": 132, "KV Levels": "132/33/13.8", "MVA": 133, "Terminals (HV/LV)": "Air bushing /Air cable" }
    ],
    "OLTC Data": [
        { "Area": "Jizan", "Substation Name": "Abu Alqaeed", "Transformer ": "ABU ALQAEED T601", "Voltage Ratio": "132/33", "MVA": 133, "Vector Group": "YNyn0d1", "OLTC Make": "MR", "OLTC Type": "OIL ", "Number of OLTC on the transformer (2 or 3)": 1, "Model / Type": "RIII 1200Y-72,5/C-14273G", "Number of Steps": 25, "Tapping Range": "145200 - 105600", "Step Voltage %": 0.0125 },
        { "Area": "Jizan", "Substation Name": "Abu Arish 2", "Transformer ": "T601", "Voltage Ratio": "132/13.8", "MVA": "67", "Vector Group": "Dyn1", "OLTC Make": "ABB", "OLTC Type": "VACCUM", "Number of OLTC on the transformer (2 or 3)": 2, "Model / Type": "VUCGRB 650/450/C", "Number of Steps": 27, "Tapping Range": "148500 - 105600", "Step Voltage %": 0.0125 }
    ],
    "Mobile Transformer": [
        { "#": 1, "Region": "SOA", "Area": "Jizan", "Substation": "Mokhtara", "Code": "6436_SOA", "Transformer number": "Mobile Transformer", "Serial Number": "54LYPT11303.2", "Manufacturer": "LEEEC", "Vector Group": "YNyn0+d1", "Manufacture Year": 2023, "System Voltage": 132, "KV Levels": "132/33/13.8", "MVA": 67, "Terminals (HV/LV)": "Air bushing /Air cable" },
        { "#": 2, "Region": "SOA", "Area": "Jizan", "Substation": "Iskan", "Code": "6430_SOA", "Transformer number": "Mobile Transformer", "Serial Number": "HP1100035024", "Manufacturer": "TGOOD", "Vector Group": "YNyn0+d1", "Manufacture Year": 2025, "System Voltage": 132, "KV Levels": "132/33/13.8", "MVA": 40, "Terminals (HV/LV)": "Air bushing /Air cable" }
    ],
    "Aux. Transformer": [
        { " No. ": 1, "Area": "Jizan", "Substation": "Abu Alqaeed", "Transformer number": "T401", "Manufactor": "UTEC", "Serial number": "1-12-160-10-0001", "Year Manufrd.": 2013, "Voltage Ratio, KV": "33/0.22 KV", "Rated Capacity": "500KVA", "Vector Group": "Dyn11", "Full Maintenance": "YES", "Action Plane": "VISUAL INSPECTION" }
    ],
    "GTR": [
        { " No. ": 1, "Area": "Jizan", "Substation": "JCPS-2", "Transformer number": "ET-301", "Manufacturer": "ABB", "Full Maintenance": "NO", "Inspection ": "NO" }
    ],
    "Shunt Reactor": [
        { " No. ": 1, "assetnum(Maximo coad)": "NG3000069651", "Substation": "Kudmi", "Transformer number": "Shunt Reactor 380 kV_Z801", "Serial number": "SHUNT_REACTOR", "AREA": "Jazan", "MAINTENANCE DIVISION": "Jazan division", "KV": 380, "MVAR RATING": 60, "MANUFACTURER": "HYUNDAI", "MANUFACTURING YEAR": 2012, "ENERGIZED": "Yes", "ENERGIZATION DATE": 2013, "EQUIPMENT STATUS": "Good", "AGE": 13 }
    ],
    "NGR": [
        { "NEUTRAL EARTHING RESISTOR": "AL SLAMAH", "Column2": "G-13-0800-30-S-00-SF-DI", "Column3": "O NE 05 10 006-1/001", "Column4": "02/06 (W11/06)", "Column5": "M.S. RESISTANCES Z.I. du Coin", "Column6": "8 KV", "Column7": 800, "Column8": "T603", "Column9": 7 }
    ],
    "Outage plan 2025-2026": [
        { "PM Transformers 2025/2026": "Jazan", "Column2": "Maintenance ", "Column3": "Ad-Dayar", "Column4": "Power Transformer 132 kV_T601", "Column5": "Preventive Maintenance", "Column6": 132, "Column7": "05 October 2025", "Column8": "07:00", "Column9": "09 October 2025", "Column10": "15:00", "Column11": 5, "Column12": "Continuous", "Column13": 1, "Column14": "PM" }
    ]
  };

  const processedData: Record<string, DeviceData[]> = {};

  Object.keys(rawData).forEach(sheetName => {
      processedData[sheetName] = processExcelData(rawData[sheetName]);
  });

  return processedData;
};