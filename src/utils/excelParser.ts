import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import { Record } from '../types/Record';

/**
 * Converts Excel serial date number to JavaScript Date object
 */
function excelDateToJSDate(serial: number): Date {
  // Excel leap year bug (1900 considered leap year)
  const offsetSerial = serial > 60 ? serial - 1 : serial;
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const epochOffset = (offsetSerial - 25569) * millisecondsPerDay;
  return new Date(epochOffset);
}

/**
 * Normalize any date input to ISO string
 */
export function normalizeDate(date: unknown): string {
  if (!date) return '';
  const d = typeof date === 'number'
    ? excelDateToJSDate(date)
    : new Date(date as string | Date);
  return isNaN(d.getTime()) ? '' : d.toISOString();
}

/**
 * Format date for UI display
 */
export function formatDateForDisplay(value: unknown): string {
  const d = new Date(value as string | Date);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Parse Excel file and convert to Record objects
 */
export async function parseExcelFile(filename: string): Promise<Record[]> {
  const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
  try {
    const fileData = await RNFS.readFile(path, 'base64');
    const workbook = XLSX.read(fileData, {
      type: 'base64',
      cellDates: true,
    });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { raw: true });

    return rows.map((row: any, index: number) => ({
      sl_no: row.sl_no ?? index + 1,
      item: row.item ?? '',
      date: normalizeDate(row.date),
      description: row.description ?? '',
    }));
  } catch (err) {
    console.error('Error parsing Excel:', err);
    return [];
  }
}

/**
 * Save records to Excel file
 */
export async function saveExcelFile(data: Record[], filename: string): Promise<string> {
  try {
    const formatted = data.map(row => {
      const dateObj = row.date ? new Date(row.date) : null;
      return {
        sl_no: row.sl_no,
        item: row.item,
        date: dateObj instanceof Date && !isNaN(dateObj.getTime()) ? dateObj : null,
        description: row.description,
      };
    });

    const ws = XLSX.utils.json_to_sheet(formatted);
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Set proper cell types for date column
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const header = ws[XLSX.utils.encode_cell({ r: 0, c: C })]?.v;
      if (header === 'date') {
        for (let R = range.s.r + 1; R <= range.e.r; ++R) {
          const addr = XLSX.utils.encode_cell({ r: R, c: C });
          const cell = ws[addr];
          if (cell?.v instanceof Date) {
            cell.t = 'd';
            cell.z = XLSX.SSF._table[14]; // mm/dd/yyyy
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'base64' });
    const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, wbout, 'base64');

    console.log('Excel saved to:', path);
    return path;
  } catch (err) {
    console.error('Error saving Excel:', err);
    throw err;
  }
}
