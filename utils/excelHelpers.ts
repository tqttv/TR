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
  // UPDATED PRIORITY: Specific request to prioritize "Substation" and "Area"
  
  // STATION KEYS MAPPING
  // Priority: Exact 'Substation' -> Contains 'Substation' -> Exact 'Location' -> Contains 'Location'
  let stationKey = firstRowKeys.find(k => k.trim().toLowerCase() === 'substation') || 
                   findKeyLike(firstRowKeys, 'substation') || 
                   firstRowKeys.find(k => k.trim().toLowerCase() === 'location') || 
                   findKeyLike(firstRowKeys, 'location') ||
                   findKeyLike(firstRowKeys, 'station') ||
                   firstRowKeys.find(k => k.includes('المحطة'));

  // AREA KEYS MAPPING
  // Priority: Exact 'Area' -> Contains 'Area' -> Exact 'Division' -> Contains 'Division'
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
        // Ensure we don't pick up the header name itself or 'null' string
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
    // We import ALL columns found in the row.
    const processedRow: any = {};
    const rowKeys = Object.keys(row);
    
    // Iterate all keys to clean data/format dates
    for (const key of rowKeys) {
        // --- DATA CLEANING ---
        // User requested removal of these specific system artifacts
        const keysToRemove = [
            '__EMPTY', '__EMPTY_1', '__EMPTY_2',       
            '__EMPTY_3', '__EMPTY_4', '__EMPTY_5', '__EMPTY_6', '__EMPTY_7' 
        ];
        
        if (keysToRemove.includes(key)) {
            continue;
        }

        const value = row[key];
        
        // Attempt to format dates if the KEY suggests it is a date
        if (key.toLowerCase().includes('date') || key.toLowerCase().includes('تاريخ')) {
             processedRow[key] = formatDate(value);
        } else {
             processedRow[key] = value;
        }
    }

    // Return the combined object: 
    // 1. Internal React ID
    // 2. Normalized Station/Area for Sidebar
    // 3. The processed columns
    return {
      id: `row-${index}`,
      stationName, // Used internally by Sidebar
      areaName,    // Used internally by Sidebar
      ...processedRow // The actual data to display
    };
  });
};

/**
 * Generates Dummy Data matching the user's screenshot structure
 */
export const generateMockData = (): DeviceData[] => {
  const stations = ['محطة الرياض 1', 'محطة جدة 3', 'محطة الدمام 5'];
  const areas = ['الوسطى', 'الغربية', 'الشرقية'];
  
  return Array.from({ length: 10 }).map((_, i) => {
    const station = stations[i % stations.length];
    const area = areas[i % areas.length];
    
    return {
      id: `mock-${i}`,
      stationName: station,
      areaName: area,
      // Matches the columns in the user screenshot
      'NO': i + 1,
      'Area': area,
      'Substation': station,
      'Transformer number': `TR-${100+i}`,
      'Voltage level': '132/13.8',
      'Equipment referance (SAP)': `SAP-${5000+i}`,
      'Serial number': `SN-${999000+i}`,
      'Energizing': '2020-01-01',
      'Manufacturer': 'Siemens',
      'Year of Manufacture': 2018,
      'Type / Model No': 'T-Class',
      'Rating (MVA)': 50,
      'last electrical Test': '2023-05-15', 
      'Tap position': 3,
      'Root Cause': 'Normal Operation',
      'Remarks': 'Checked ok'
    };
  });
};