export interface Item {
  uid: string;
  code: string;
  name: string;
  qty: number;
  min: number;
  max: number;
  unit: string;
  lastUpdated?: string;
  isCounted?: boolean;
  totalUsed?: number;
  countRounds?: number;
  usageStats?: Record<string, number>;
  exp?: string;
  lot?: string;
  img?: string;
}

export interface Shelf {
  id: string;
  name: string;
  items: Item[];
}

export interface Cabinet {
  id: string;
  name: string;
  shelves: Shelf[];
}

export interface WardData {
  cabinets: Cabinet[];
  unassigned: Item[];
}

export interface AuditLog {
  id: string;
  timestamp: string;
  ward: string;
  cabinet: string;
  shelf: string;
  code: string;
  name: string;
  oldQty: number;
  newQty: number;
  change: string;
  actionType: 'ตรวจนับ' | 'เบิกใช้' | 'เติมของ' | 'ปรับปรุงยอด';
  note: string;
  responsiblePerson: string;
}

export interface PrintSettings {
  cardTheme: 'gold' | 'cyber-blue' | 'deep-purple' | 'emerald-green' | 'dark-grey';
  paperSize: 'a4-portrait' | 'a4-landscape' | 'a5-portrait';
  fontFamily: string;
  margin: number;
  fontSizeHosp: number;
  fontSizeWard: number;
  fontSizeShelf: number;
  fontSizeItem: number;
  fontSizeFooter: number;
  showFooter: boolean;
  rules: string[];
  responsiblePerson: string;
  allowAiMaxAdjustment: boolean;
}

export interface CloudSettings {
  gasUrl: string;
  autoSync: boolean;
  lastSync?: string | null;
}
