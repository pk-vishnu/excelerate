import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import { Record } from '../types/Record';

/**
 * Converts Excel serial date number to JavaScript Date object
 * Excel dates are days since 1900-01-01 (with a leap year bug)
 */
function excelDateToJSDate(serial: number): Date {
  // Excel has a leap year bug where it thinks 1900 was a leap year
  // Adjust by 1 day if date is after Feb 28, 1900
  let adjustedSerial = serial;
  if (serial > 60) {
    adjustedSerial -= 1;  // Adjust for Excel's leap year bug
  }
  
  // Excel dates are days since 1900-01-01
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const offsetDays = 25569; // Days between 1900-01-01 and 1970-01-01
  
  const utcDays = adjustedSerial - offsetDays;
  const utcMilliseconds = utcDays * millisecondsPerDay;
  
  return new Date(utcMilliseconds);
}

/**
 * Converts JavaScript Date to Excel serial number format
 */
function jsDateToExcelDate(date: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const offsetDays = 25569; // Days between 1900-01-01 and 1970-01-01
  
  const utcMilliseconds = date.getTime();
  let utcDays = utcMilliseconds / millisecondsPerDay;
  utcDays += offsetDays;
  
  // Adjust for Excel's leap year bug
  if (utcDays >= 60) {
    utcDays += 1;
  }
  
  return Math.round(utcDays);
}

/**
 * Checks if a value is a valid date
 */
function isValidDate(d: any): boolean {
  if (d instanceof Date) {
    return !isNaN(d.getTime());
  }
  
  if (typeof d === 'string') {
    const parsed = new Date(d);
    return !isNaN(parsed.getTime());
  }
  
  return false;
}

/**
 * Parse Excel file and convert to Record objects
 */
export async function parseExcelFile(filename: string): Promise<Record[]> {
  const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
  
  try {
    const fileData = await RNFS.readFile(path, 'base64');
    const workbook = XLSX.read(fileData, { type: 'base64', cellDates: true });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // This will attempt to parse dates automatically
    const rawData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

    const data = rawData.map((row: any, index: number) => {
      let dateValue: Date | string = new Date();
      
      if (row.date) {
        if (typeof row.date === 'number') {
          // Handle Excel number date
          dateValue = excelDateToJSDate(row.date);
        } else if (row.date instanceof Date) {
          // Already a date object
          dateValue = row.date;
        } else if (typeof row.date === 'string') {
          // Try to parse string date
          const parsedDate = new Date(row.date);
          if (!isNaN(parsedDate.getTime())) {
            dateValue = parsedDate;
          }
        }
      }
      
      return {
        sl_no: row.sl_no ?? index + 1,
        item: row.item ?? '',
        date: dateValue instanceof Date ? dateValue.toISOString() : dateValue,
        description: row.description ?? '',
      };
    });

    console.log('Parsed data:', data);
    return data;
  } catch (err) {
    console.error('Error reading file:', err);
    return [];
  }
}

/**
 * Save records to Excel file
 */
export async function saveExcelFile(data: Record[], filename: string): Promise<string> {
  try {
    // Format data for Excel with proper date handling
    const formattedData = data.map((row : any) => {
      let dateValue: Date | null = null;
      
      if (row.date) {
        if (typeof row.date === 'string') {
          const parsedDate = new Date(row.date);
          if (!isNaN(parsedDate.getTime())) {
            dateValue = parsedDate;
          }
        } else if (row.date instanceof Date) {
          dateValue = row.date;
        }
      }
      
      return {
        sl_no: row.sl_no,
        item: row.item,
        date: dateValue,
        description: row.description,
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(formattedData);
    
    // Ensure dates are formatted properly in Excel
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      const header = ws[cellAddress]?.v;

      if (header === 'date') {
        // Set column format to date
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const cellRef = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[cellRef];
          if (cell && cell.v) {
            // Ensure it's a proper JavaScript Date object
            if (typeof cell.v === 'string') {
              const parsedDate = new Date(cell.v);
              if (!isNaN(parsedDate.getTime())) {
                cell.v = parsedDate;
              }
            }
            
            if (cell.v instanceof Date) {
              cell.t = 'd'; // Set cell type to date
              cell.z = XLSX.SSF._table[14]; // Format as date (m/d/yyyy)
            }
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // Write as binary string
    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

    // Save to file
    const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, wbout, 'ascii');
    console.log(`Excel file saved to: ${path}`);
    
    return path;
  } catch (error) {
    console.error('Error saving Excel file:', error);
    throw error;
  }
}

/**
 * Format date for display in the UI
 */
export function formatDateForDisplay(date: Date | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Convert any date representation to ISO string format for consistent storage
 */
export function normalizeDate(date: Date | string | number | null | undefined): string {
  if (!date) return '';
  
  let dateObj: Date;
  
  if (typeof date === 'number') {
    // Handle Excel serial number date
    dateObj = excelDateToJSDate(date);
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return '';
  }
  
  if (isNaN(dateObj.getTime())) {
    return '';
  }
  
  return dateObj.toISOString();
}