import RNFS from 'react-native-fs';
import XLSX from 'xlsx';
import { Record } from '../types/Record';
export async function parseExcelFile(filename: string) {
  const path = `${RNFS.DownloadDirectoryPath}/${filename}`;
  
  try {
    // Read the file
    const fileData = await RNFS.readFile(path, 'base64');
    
    // Parse the workbook directly from base64
    const workbook = XLSX.read(fileData, { type: 'base64' });
    
    // Get the first sheet name
    const sheetName = workbook.SheetNames[0];
    
    // Get the first sheet
    const worksheet = workbook.Sheets[sheetName];

    // Parse the data with headers
    const rawData = XLSX.utils.sheet_to_json(worksheet);

    // If your Excel file doesn't have proper headers,
    // map the raw data to your expected structure
    const data = rawData.map((row: any, index: number) => ({
      sl_no: row.sl_no ?? index + 1,
      item: row.item ?? '',
      date: row.date ?? '',
      description: row.description ?? '',
    }));
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