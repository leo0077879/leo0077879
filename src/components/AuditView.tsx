import React from 'react';
import { Download, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { AuditLog } from '../types';

interface AuditViewProps {
  logs: AuditLog[];
  onClearLogs: () => void;
}

export const AuditView: React.FC<AuditViewProps> = ({ logs, onClearLogs }) => {
  const handleExportExcel = () => {
    if (logs.length === 0) {
      alert('ไม่มีข้อมูลประวัติที่จะส่งออก');
      return;
    }

    const exportRows = logs.map((log, idx) => ({
      ลำดับ: idx + 1,
      'วัน-เวลา': log.timestamp,
      หอผู้ป่วย: log.ward,
      ตู้: log.cabinet,
      ชั้นวาง: log.shelf,
      รหัสสิ่งของ: log.code,
      ชื่อสิ่งของ: log.name,
      จำนวนเดิม: log.oldQty,
      จำนวนใหม่: log.newQty,
      ส่วนต่าง: log.change,
      ประเภทรายการ: log.actionType,
      ผู้รับผิดชอบ: log.responsiblePerson,
      หมายเหตุ: log.note,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, ws, 'ประวัติเบิกจ่าย');
    XLSX.writeFile(wb, `ประวัติการเบิกจ่าย_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <span>📋</span>
            บันทึกประวัติการเบิก-จ่าย และตรวจนับสต็อก (Audit Log)
          </h3>
          <p className="text-xs text-slate-400">
            เก็บบันทึกการเปลี่ยนแปลงจำนวนสต็อก การตรวจนับเวร และหมายเหตุของผู้ปฏิบัติงาน
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออกประวัติ (Excel)
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('คุณต้องการล้างประวัติการเบิก-จ่ายทั้งหมดหรือไม่?')) {
                onClearLogs();
              }
            }}
            className="inline-flex items-center gap-1 bg-red-900/50 hover:bg-red-800 text-red-200 px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            ล้างประวัติ
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto max-h-[500px] border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-slate-950 text-amber-400 sticky top-0">
            <tr>
              <th className="p-2.5 border-b border-slate-800 w-36">วัน-เวลา</th>
              <th className="p-2.5 border-b border-slate-800">ตำแหน่ง (หอ/ตู้/ชั้น)</th>
              <th className="p-2.5 border-b border-slate-800 w-24">รหัส</th>
              <th className="p-2.5 border-b border-slate-800">ชื่อสิ่งของ</th>
              <th className="p-2.5 border-b border-slate-800 text-center w-16">เดิม</th>
              <th className="p-2.5 border-b border-slate-800 text-center w-16">ใหม่</th>
              <th className="p-2.5 border-b border-slate-800 text-center w-16">ส่วนต่าง</th>
              <th className="p-2.5 border-b border-slate-800 text-center w-24">ประเภท</th>
              <th className="p-2.5 border-b border-slate-800">ผู้รับผิดชอบ / หมายเหตุ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-slate-200">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={9} className="p-8 text-center text-slate-500">
                  ยังไม่มีประวัติการเบิก-จ่าย หรือตรวจนับ
                </td>
              </tr>
            ) : (
              logs.map((log) => {
                const isDecrease = log.newQty < log.oldQty;
                const isIncrease = log.newQty > log.oldQty;

                return (
                  <tr key={log.id} className="hover:bg-slate-950/60">
                    <td className="p-2.5 text-slate-400 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="p-2.5 text-slate-300 text-[11px]">
                      {log.ward} ➔ {log.cabinet} ➔ {log.shelf}
                    </td>
                    <td className="p-2.5 font-mono font-bold text-amber-300">{log.code}</td>
                    <td className="p-2.5 font-medium">{log.name}</td>
                    <td className="p-2.5 text-center font-mono text-slate-400">{log.oldQty}</td>
                    <td className="p-2.5 text-center font-mono font-bold text-white">{log.newQty}</td>
                    <td
                      className={`p-2.5 text-center font-mono font-bold ${
                        isDecrease ? 'text-red-400' : isIncrease ? 'text-emerald-400' : 'text-slate-400'
                      }`}
                    >
                      {log.change}
                    </td>
                    <td className="p-2.5 text-center">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[10px] font-semibold">
                        {log.actionType}
                      </span>
                    </td>
                    <td className="p-2.5 text-slate-300 text-[11px]">
                      <span className="font-semibold text-sky-400">{log.responsiblePerson}</span>
                      {log.note && log.note !== '-' && (
                        <div className="text-slate-400 text-[10px]">({log.note})</div>
                      )}
                    </td>
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
