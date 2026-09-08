import React, { useState } from 'react';
import { Search, Download, Sparkles } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Cabinet, Item, PrintSettings } from '../types';
import {
  checkExpStatus,
  getCurrentDateKey,
  getCurrentMonthKey,
  getCurrentYearKey,
} from '../utils/helpers';

interface AnalyticsViewProps {
  currentWard: string;
  cabinets: Cabinet[];
  printSettings: PrintSettings;
  onToggleAiMax: (enabled: boolean) => void;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  currentWard,
  cabinets,
  printSettings,
  onToggleAiMax,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'urgent' | 'need' | 'full' | 'exp'>('all');

  const todayKey = getCurrentDateKey();
  const monthKey = getCurrentMonthKey();
  const yearKey = getCurrentYearKey();

  // Collect all items across all cabinets & shelves in current ward
  const allItemsWithLocation = cabinets.flatMap((cab) =>
    cab.shelves.flatMap((shelf) =>
      shelf.items.map((item) => ({
        cabinetName: cab.name,
        shelfName: shelf.name,
        item,
      }))
    )
  );

  const filteredItems = allItemsWithLocation.filter(({ item }) => {
    const code = (item.code || '').toLowerCase();
    const name = (item.name || '').toLowerCase();
    const kw = searchKeyword.toLowerCase();

    if (kw && !code.includes(kw) && !name.includes(kw)) return false;

    const qty = item.qty || 0;
    const min = item.min || 0;
    const max = item.max || 0;
    const restock = max > qty ? max - qty : 0;
    const expInfo = checkExpStatus(item.exp);

    const isUrgent = qty <= min && min < max;
    const isNeed = restock > 0;
    const isFull = qty >= max;
    const isExpAlert = expInfo.status === 'expired' || expInfo.status === 'near-exp';

    if (filterType === 'urgent') return isUrgent;
    if (filterType === 'need') return isNeed;
    if (filterType === 'full') return isFull;
    if (filterType === 'exp') return isExpAlert;

    return true;
  });

  // Export Requisition Report to Excel
  const handleExportExcel = () => {
    const requisitionRows: any[] = [];
    let no = 1;

    allItemsWithLocation.forEach(({ cabinetName, shelfName, item }) => {
      const qty = item.qty || 0;
      const min = item.min || 0;
      const max = item.max || 0;
      const restock = max > qty ? max - qty : 0;
      const expInfo = checkExpStatus(item.exp);

      if (restock > 0 || qty <= min || expInfo.status === 'expired') {
        let priority = qty <= min ? 'ด่วน (ต่ำกว่า MIN)' : 'ปกติ';
        if (expInfo.status === 'expired') priority = 'ด่วนมาก (หมดอายุ)';

        requisitionRows.push({
          ลำดับ: no++,
          หอผู้ป่วย: currentWard,
          ตู้: cabinetName,
          ชั้นวาง: shelfName,
          รหัสสิ่งของ: item.code,
          ชื่อสิ่งของ: item.name,
          จำนวนคงเหลือ: qty,
          MIN: min,
          MAX: max,
          หน่วย: item.unit || 'ชิ้น',
          ยอดขอเบิกเติม: restock,
          ระดับความเร่งด่วน: priority,
          วันหมดอายุ: item.exp || '-',
          'Lot No.': item.lot || '-',
        });
      }
    });

    if (requisitionRows.length === 0) {
      alert('ยินดีด้วยครับ! ไม่มีรายการที่ต้องเบิกเติมในหอผู้ป่วยนี้');
      return;
    }

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(requisitionRows);
    XLSX.utils.book_append_sheet(wb, ws, 'ใบขอเบิกเวชภัณฑ์');
    XLSX.writeFile(wb, `ใบขอเบิก_${currentWard}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-sky-400 flex items-center gap-2">
            <span>📈</span>
            รายงานสถิติการใช้งาน & แนะนำรายการเบิก
          </h3>
          <p className="text-xs text-slate-400">
            ระบบวิเคราะห์ยอดคงคลัง คำนวณปริมาณที่ต้องขอเบิกเติม และสถิติการใช้งาน
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          ส่งออกรายงานเบิก (Excel)
        </button>
      </div>

      {/* Filter and AI Box */}
      <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
        {/* Search */}
        <div className="relative min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            placeholder="ค้นหารหัส หรือ ชื่อสิ่งของ..."
            className="w-full bg-slate-900 border border-slate-700 text-white pl-8 pr-3 py-1.5 rounded-md focus:border-sky-400 focus:outline-none"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-2.5 py-1 rounded font-semibold ${
              filterType === 'all' ? 'bg-sky-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            ทั้งหมด
          </button>
          <button
            type="button"
            onClick={() => setFilterType('urgent')}
            className={`px-2.5 py-1 rounded font-semibold ${
              filterType === 'urgent' ? 'bg-red-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            🔴 ด่วน (ต่ำกว่า MIN)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('need')}
            className={`px-2.5 py-1 rounded font-semibold ${
              filterType === 'need' ? 'bg-amber-500 text-black font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            🟡 ต้องเติม (ไม่เต็ม MAX)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('full')}
            className={`px-2.5 py-1 rounded font-semibold ${
              filterType === 'full' ? 'bg-emerald-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            🟢 เต็ม MAX
          </button>
          <button
            type="button"
            onClick={() => setFilterType('exp')}
            className={`px-2.5 py-1 rounded font-semibold ${
              filterType === 'exp' ? 'bg-purple-600 text-white font-bold' : 'bg-slate-800 text-slate-300'
            }`}
          >
            ⚠️ หมดอายุ/ใกล้หมด
          </button>
        </div>

        {/* AI MAX Analysis Switch */}
        <label className="flex items-center gap-2 bg-slate-900 px-3 py-1 rounded-full border border-slate-800 cursor-pointer select-none">
          <Sparkles className="w-3.5 h-3.5 text-sky-400" />
          <span className="font-bold text-sky-400">AI วิเคราะห์ MAX:</span>
          <input
            type="checkbox"
            checked={printSettings.allowAiMaxAdjustment}
            onChange={(e) => onToggleAiMax(e.target.checked)}
            className="w-3.5 h-3.5 rounded text-sky-500 focus:ring-0 cursor-pointer"
          />
        </label>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-96 border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-amber-400 sticky top-0">
            <tr>
              <th className="p-2.5 border-b border-slate-800">รหัส</th>
              <th className="p-2.5 border-b border-slate-800">ชื่อสิ่งของ</th>
              <th className="p-2.5 border-b border-slate-800">ตำแหน่ง</th>
              <th className="p-2.5 border-b border-slate-800 text-center">คงเหลือ</th>
              <th className="p-2.5 border-b border-slate-800 text-center">MIN/MAX</th>
              <th className="p-2.5 border-b border-slate-800">วันหมดอายุ</th>
              <th className="p-2.5 border-b border-slate-800 text-center">รายวัน</th>
              <th className="p-2.5 border-b border-slate-800 text-center">รายเดือน</th>
              <th className="p-2.5 border-b border-slate-800 text-center">รายปี</th>
              <th className="p-2.5 border-b border-slate-800 text-center text-sky-400">ต้องเบิก</th>
              {printSettings.allowAiMaxAdjustment && (
                <th className="p-2.5 border-b border-slate-800 text-center">วิเคราะห์ AI</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {filteredItems.length === 0 ? (
              <tr>
                <td
                  colSpan={printSettings.allowAiMaxAdjustment ? 11 : 10}
                  className="p-6 text-center text-slate-500"
                >
                  ไม่พบรายการสิ่งของตรงตามเงื่อนไข
                </td>
              </tr>
            ) : (
              filteredItems.map(({ cabinetName, shelfName, item }) => {
                const qty = item.qty || 0;
                const min = item.min || 0;
                const max = item.max || 0;
                const restock = max > qty ? max - qty : 0;
                const expInfo = checkExpStatus(item.exp);
                const isUrgent = qty <= min && min < max;
                const isNeed = restock > 0;

                const usageStats = item.usageStats || {};
                const todayUsage = usageStats[todayKey] || 0;
                const monthUsage = usageStats[monthKey] || 0;
                const yearUsage = usageStats[yearKey] || 0;

                return (
                  <tr key={item.uid} className="hover:bg-slate-950/60">
                    <td className="p-2.5 font-mono font-bold text-amber-300">{item.code}</td>
                    <td className="p-2.5">{item.name}</td>
                    <td className="p-2.5 text-slate-400 text-[11px]">
                      {cabinetName} ➔ {shelfName}
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono">
                      {qty} {item.unit}
                    </td>
                    <td className="p-2.5 text-center text-slate-400">
                      {min}/{max}
                    </td>
                    <td className="p-2.5">
                      {item.exp ? (
                        <span
                          className={
                            expInfo.status === 'expired'
                              ? 'text-red-400 font-bold'
                              : expInfo.status === 'near-exp'
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {item.exp}
                        </span>
                      ) : (
                        <span className="text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-2.5 text-center text-emerald-400 font-mono font-semibold">
                      {todayUsage}
                    </td>
                    <td className="p-2.5 text-center text-sky-400 font-mono font-semibold">
                      {monthUsage}
                    </td>
                    <td className="p-2.5 text-center text-amber-400 font-mono font-semibold">
                      {yearUsage}
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono">
                      {restock > 0 ? (
                        <span className="text-amber-300">
                          +{restock} {item.unit}
                        </span>
                      ) : (
                        <span className="text-emerald-500">เต็ม</span>
                      )}
                      <div>
                        {isUrgent ? (
                          <span className="bg-red-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                            ด่วน
                          </span>
                        ) : isNeed ? (
                          <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded text-[10px] font-bold">
                            ปกติ
                          </span>
                        ) : (
                          <span className="bg-emerald-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                            ครบ
                          </span>
                        )}
                      </div>
                    </td>
                    {printSettings.allowAiMaxAdjustment && (
                      <td className="p-2.5 text-center">
                        {(item.totalUsed || 0) > max * 1.5 && max > 0 ? (
                          <span className="text-red-400 font-bold">🔥 ควรปรับเพิ่ม MAX</span>
                        ) : (
                          <span className="text-emerald-400">✅ เหมาะสม</span>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
