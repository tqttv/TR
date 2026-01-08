// Flexible interface to hold any Excel data
export interface DeviceData {
  id: string; // Unique ID generated for React keys
  stationName: string; // The normalized station name for filtering
  areaName?: string; // The normalized area name
  date?: string; // Optional normalized date for filtering
  [key: string]: any; // Allow accessing any other column from Excel
}

export interface FilterState {
  station: string;
  area: string;
}

// Helper to ignore internal keys when rendering the table
export const INTERNAL_KEYS = ['id', 'stationName', 'areaName', 'date', '__rowNum__'];