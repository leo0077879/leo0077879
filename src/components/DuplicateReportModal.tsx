import React, { useMemo } from 'react';
import { Item } from '../types';

interface DuplicateReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  unassignedItems: Item[];
  onCleanDuplicateGroup: (code: string, name: string) => void;
  onCleanAllDuplicates: () => void;
}

export const DuplicateReportModal: React.FC<DuplicateReportModalProps> = ({
  isOpen,
  onClose,
  unassignedItems,
  onCleanDuplicateGroup,
  onCleanAllDuplicates,
}) => {
  const duplicateGroups = useMemo(() => {
    const groupsMap = new Map<string, { code: string; name: string; items: Item[] }>();

    unassignedItems.forEach((it) => {
      const code = (it.code || '').trim();
      const name = (it.name || '').trim();
      const key = `${code}___${name}`;
      if (!groupsMap.has(key)) {
        groupsMap.set(key, { code, name, items: [] });
      }
      groupsMap.get(key)!.items.push(it);
    });

    const dups: { code: string; name: string; items: Item[]; totalQty: number; unit: string }[] = [];
    groupsMap.forEach((grp) => {
      if (grp.items.length > 1) {
        let total = 0;
        grp.items.forEach((it) => (total += it.qty || 0));
        dups.push({
          code: grp.code,
          name: grp.name,
          items: grp.items,
          totalQty: total,
          unit: grp.items[0]?.unit || 'ชิ้น',
        });
      }
    });

    return dups;
  }, [unassignedItems]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔍</span>
            <h3 className="text-base font-bold text-purple-300">
              รายงานและกรองรายการซ้ำในของนอกคลัง
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Action bar */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-bold text-purple-300">
            พบรายการซ้ำทั้งหมด {duplicateGroups.length} กลุ่มรายการ
          </span>
          {duplicateGroups.length > 0 && (
            <button
              type="button"
              onClick={onCleanAllDuplicates}
              className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-3 py-1.5 rounded-md shadow-xs transition-colors"
            >
              ✨ ลบรายการซ้ำทั้งหมด (คงเหลือไว้อย่างละ 1 ชิ้น)
            </button>
          )}
        </div>

        {/* Table of duplicates */}
        <div className="p-5 overflow-y-auto max-h-96">
          {duplicateGroups.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-sm">
              🎉 ไม่พบรายการของที่ซ้ำกันในของนอกคลัง
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-purple-300 sticky top-0">
                <tr>
                  <th className="p-2 border-b border-slate-800">รหัสสิ่งของ</th>
                  <th className="p-2 border-b border-slate-800">ชื่อสิ่งของ</th>
                  <th className="p-2 border-b border-slate-800 text-center">จำนวนซ้ำ</th>
                  <th className="p-2 border-b border-slate-800 text-center">รวมสต็อก</th>
                  <th className="p-2 border-b border-slate-800 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {duplicateGroups.map((grp, idx) => (
                  <tr key={idx} className="hover:bg-slate-950/60">
                    <td className="p-2 font-mono font-bold text-purple-400">{grp.code}</td>
                    <td className="p-2">{grp.name}</td>
                    <td className="p-2 text-center">
                      <span className="bg-red-600/80 text-white font-bold px-2 py-0.5 rounded-full text-[10px]">
                        ซ้ำ {grp.items.length}
                      </span>
                    </td>
                    <td className="p-2 text-center font-bold font-mono">
                      {grp.totalQty} {grp.unit}
                    </td>
                    <td className="p-2 text-center">
                      <button
                        type="button"
                        onClick={() => onCleanDuplicateGroup(grp.code, grp.name)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-2.5 py-1 rounded text-[11px]"
                      >
                        🧹 เหลือ 1 ชิ้น
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/80 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-1.5 rounded-lg text-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
