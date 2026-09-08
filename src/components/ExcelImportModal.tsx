import React, { useState } from 'react';
import { Upload, Sparkles, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { extractCodeAndNameWithAI } from '../utils/helpers';
import { Item } from '../types';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingItems: Item[];
  onImportItems: (newItems: Item[]) => void;
}

interface ParsedRow {
  rawCode: string;
  rawName: string;
  qty: number;
  min: number;
  max: number;
  unit: string;
}

export const ExcelImportModal: React.FC<ExcelImportModalProps> = ({
  isOpen,
  onClose,
  existingItems,
  onImportItems,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [dupAction, setDupAction] = useState<'skip' | 'merge' | 'import_all'>('skip');
  const [useAi, setUseAi] = useState(true);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const jsonRows: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], {
          header: 1,
        });

        if (jsonRows.length < 2) {
          alert('ไฟล์ Excel ไม่มีข้อมูลเพียงพอ');
          return;
        }

        const header = jsonRows[0].map((h) => String(h || '').toLowerCase().trim());
        let codeIdx = header.findIndex((h) => h.includes('รหัส') || h.includes('code'));
        let nameIdx = header.findIndex((h) => h.includes('ชื่อ') || h.includes('name'));
        let qtyIdx = header.findIndex((h) => h.includes('จำนวน') || h.includes('qty'));
        let minIdx = header.findIndex((h) => h.includes('min') || h.includes('ต่ำ'));
        let maxIdx = header.findIndex((h) => h.includes('max') || h.includes('สูง'));
        let unitIdx = header.findIndex((h) => h.includes('หน่วย') || h.includes('unit'));

        if (codeIdx === -1) codeIdx = 0;
        if (nameIdx === -1) nameIdx = 1;
        if (qtyIdx === -1) qtyIdx = 2;
        if (minIdx === -1) minIdx = 3;
        if (maxIdx === -1) maxIdx = 4;
        if (unitIdx === -1) unitIdx = 5;

        const results: ParsedRow[] = [];
        for (let i = 1; i < jsonRows.length; i++) {
          const row = jsonRows[i];
          if (!row || row.length === 0) continue;
          const rawCode = String(row[codeIdx] || '').trim();
          const rawName = String(row[nameIdx] || '').trim();
          if (!rawCode && !rawName) continue;

          results.push({
            rawCode,
            rawName,
            qty: parseFloat(row[qtyIdx]) || 0,
            min: parseFloat(row[minIdx]) || 0,
            max: parseFloat(row[maxIdx]) || 10,
            unit: String(row[unitIdx] || 'ชิ้น').trim(),
          });
        }

        setParsedRows(results);
      } catch {
        alert('เกิดข้อผิดพลาดในการอ่านไฟล์ Excel กรุณาตรวจสอบไฟล์');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleProcessImport = () => {
    if (parsedRows.length === 0) return;

    const existingCodeMap = new Map<string, Item>();
    existingItems.forEach((it) => {
      const c = (it.code || '').toLowerCase().trim();
      if (c) existingCodeMap.set(c, it);
    });

    const newItemsToCreate: Item[] = [];
    let skipped = 0;
    let merged = 0;

    parsedRows.forEach((r, idx) => {
      let finalCode = r.rawCode;
      let finalName = r.rawName;

      if (useAi) {
        const parsed = extractCodeAndNameWithAI(r.rawCode, r.rawName);
        finalCode = parsed.code;
        finalName = parsed.name;
      }

      const lowerCode = finalCode.toLowerCase();
      const existing = existingCodeMap.get(lowerCode);

      if (existing) {
        if (dupAction === 'skip') {
          skipped++;
          return;
        } else if (dupAction === 'merge') {
          existing.qty += r.qty;
          merged++;
          return;
        }
      }

      const item: Item = {
        uid: `imported_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        code: finalCode || `ITEM-${idx + 1}`,
        name: finalName || 'เวชภัณฑ์นำเข้า',
        qty: r.qty,
        min: r.min,
        max: r.max,
        unit: r.unit || 'ชิ้น',
        lastUpdated: '',
        isCounted: false,
        totalUsed: 0,
        countRounds: 0,
        usageStats: {},
        exp: '',
        lot: '',
      };

      existingCodeMap.set(lowerCode, item);
      newItemsToCreate.push(item);
    });

    onImportItems(newItemsToCreate);
    alert(
      `🎉 นำเข้าข้อมูลสำเร็จ ${newItemsToCreate.length} รายการ! (ข้ามรายการซ้ำ ${skipped}, รวมสมทบ ${merged})`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-orange-400" />
            <h3 className="text-base font-bold text-orange-400">
              นำเข้าข้อมูล Excel + AI แยกรหัสอัตโนมัติ
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* File Picker */}
          <div className="bg-slate-950 p-4 rounded-lg border-2 border-dashed border-slate-700 hover:border-orange-400 text-center cursor-pointer transition-colors">
            <input
              type="file"
              id="excelInputFile"
              accept=".xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
            />
            <label htmlFor="excelInputFile" className="cursor-pointer block">
              <Upload className="w-8 h-8 text-orange-400 mx-auto mb-2" />
              <span className="text-sm font-bold text-slate-200 block">
                เลือกไฟล์ Excel รายงานโรงพยาบาล (.xlsx, .xls)
              </span>
              <span className="text-slate-400 text-[11px] block mt-1">
                ระบบจะค้นหาคอลัมน์ รหัส, ชื่อ, จำนวน, MIN, MAX ให้อัตโนมัติ
              </span>
            </label>
          </div>

          {/* Duplicate handling option */}
          <div>
            <label className="block font-bold text-amber-400 mb-1.5">🎯 ตัวเลือกการนำเข้า:</label>
            <div className="grid grid-cols-3 gap-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="dupAction"
                  value="skip"
                  checked={dupAction === 'skip'}
                  onChange={() => setDupAction('skip')}
                  className="text-orange-500"
                />
                <span>1. ข้ามรายการซ้ำ</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="dupAction"
                  value="merge"
                  checked={dupAction === 'merge'}
                  onChange={() => setDupAction('merge')}
                  className="text-orange-500"
                />
                <span>2. รวมจำนวนสมทบ</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
                <input
                  type="radio"
                  name="dupAction"
                  value="import_all"
                  checked={dupAction === 'import_all'}
                  onChange={() => setDupAction('import_all')}
                  className="text-orange-500"
                />
                <span>3. นำเข้าทั้งหมด</span>
              </label>
            </div>
          </div>

          {/* AI smart parser checkbox */}
          <label className="flex items-center gap-2 bg-slate-950 p-2.5 rounded-lg border border-emerald-900/60 cursor-pointer select-none">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <input
              type="checkbox"
              checked={useAi}
              onChange={(e) => setUseAi(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-0"
            />
            <span className="font-bold text-emerald-400">
              เปิดใช้งาน AI Smart Parser (แยกรหัสและชื่อสิ่งของออกจากข้อความผสมอัตโนมัติ)
            </span>
          </label>

          {/* Preview Section */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-emerald-400 bg-emerald-950/60 p-2 rounded-t-lg border border-emerald-800">
                <span>📊 ตรวจพบทั้งหมด {parsedRows.length} รายการ (แสดงตัวอย่าง 10 รายการแรก):</span>
              </div>
              <div className="overflow-x-auto max-h-48 border border-slate-800 rounded-b-lg">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-950 text-slate-400 sticky top-0">
                    <tr>
                      <th className="p-2 border-b border-slate-800 w-10 text-center">#</th>
                      <th className="p-2 border-b border-slate-800">รหัสที่แยกได้</th>
                      <th className="p-2 border-b border-slate-800">ชื่อสิ่งของ</th>
                      <th className="p-2 border-b border-slate-800 text-center">จำนวน</th>
                      <th className="p-2 border-b border-slate-800 text-center">สถานะ AI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {parsedRows.slice(0, 10).map((r, i) => {
                      const aiInfo = useAi
                        ? extractCodeAndNameWithAI(r.rawCode, r.rawName)
                        : { code: r.rawCode, name: r.rawName, aiStatus: 'รหัสเดิม', statusClass: 'bg-slate-800 text-slate-300' };

                      return (
                        <tr key={i} className="hover:bg-slate-950/60">
                          <td className="p-2 text-center text-slate-500">{i + 1}</td>
                          <td className="p-2 font-mono font-bold text-emerald-400">{aiInfo.code}</td>
                          <td className="p-2 truncate max-w-xs">{aiInfo.name}</td>
                          <td className="p-2 text-center font-mono">
                            {r.qty} {r.unit}
                          </td>
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${aiInfo.statusClass}`}>
                              {aiInfo.aiStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/80 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg text-xs"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleProcessImport}
            disabled={parsedRows.length === 0}
            className="bg-orange-600 hover:bg-orange-500 disabled:opacity-40 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-md transition-colors inline-flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            ยืนยันนำเข้า ({parsedRows.length} รายการ)
          </button>
        </div>
      </div>
    </div>
  );
};
