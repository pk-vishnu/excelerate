import RNFS from 'react-native-fs';
import XLSX from 'xlsx';

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
    
    return data;
  } catch (err) {
    console.error('Error reading file:', err);
    return [];
  }
}