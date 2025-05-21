import { parseExcelFile } from './excelParser';
import { checkPermission } from './permissions';
import { Record } from '../types/Record';

export async function loadRecordsFromFile(filename = 'data.xlsx'): Promise<Record[]> {
  const hasPermission = await checkPermission();
  if (!hasPermission) throw new Error('Permission denied');

  const data = await parseExcelFile(filename);
  if (!Array.isArray(data)) throw new Error('Invalid data format');
  
  return data;
}
