import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import { Record } from '../types/Record';

function excelDateToJSDate(serial: number): string {
    const utc_days = Math.floor(serial - 25569);
    const utc_value = utc_days * 86400;
    const date_info = new Date(utc_value * 1000);
    return date_info.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function parseExcelFile(filename: string) {
  const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
  
  try {
    const fileData = await RNFS.readFile(path, 'base64');
    const workbook = XLSX.read(fileData, { type: 'base64' });

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const rawData = XLSX.utils.sheet_to_json(worksheet);

    const data = rawData.map((row: any, index: number) => {
      let rawDate = row.date ?? '';
      let parsedDate = '';

      if (typeof rawDate === 'number') {
        parsedDate = excelDateToJSDate(rawDate);
      } else if (typeof rawDate === 'string') {
        parsedDate = new Date(rawDate).toISOString().split('T')[0];
      }

      return {
        sl_no: row.sl_no ?? index + 1,
        item: row.item ?? '',
        date: parsedDate,
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

export async function saveExcelFile(data: Record[], filename: string){
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const wbout = XLSX.write(wb, { type: 'binary', bookType: 'xlsx' });

    const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
    await RNFS.writeFile(path, wbout, 'ascii');
    console.log(`Excel file saved to: ${path}`);
}