import { Record } from '../types/Record';

export type SortDirection = 'asc' | 'desc';
export type SortKey = keyof Record;

export function sortRecords(
  records: Record[],
  sortKey: SortKey,
  sortDirection: SortDirection
): Record[] {
  return [...records].sort((a:any, b:any) => {
    const valA = a[sortKey];
    const valB = b[sortKey];

    // Handle null/undefined
    if (valA == null) return 1;
    if (valB == null) return -1;

    // Compare by type
    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc'
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA);
    }

    if (typeof valA === 'number' && typeof valB === 'number') {
      return sortDirection === 'asc' ? valA - valB : valB - valA;
    }

    if (typeof valA === 'boolean' && typeof valB === 'boolean') {
      return sortDirection === 'asc'
        ? Number(valA) - Number(valB)
        : Number(valB) - Number(valA);
    }

    if (valA instanceof Date && valB instanceof Date) {
      return sortDirection === 'asc'
        ? valA.getTime() - valB.getTime()
        : valB.getTime() - valA.getTime();
    }

    return 0;
  });
}
