import React, { useState } from 'react';
import { Rocket, X } from 'lucide-react';
import { Cabinet } from '../types';

interface BulkMoveBarProps {
  selectedCount: number;
  cabinets: Cabinet[];
  onExecuteBulkMove: (targetCabIndex: number, targetShelfIndex: number) => void;
  onClearSelection: () => void;
}

export const BulkMoveBar: React.FC<BulkMoveBarProps> = ({
  selectedCount,
  cabinets,
  onExecuteBulkMove,
  onClearSelection,
}) => {
  const [targetCabIndex, setTargetCabIndex] = useState(0);
  const [targetShelfIndex, setTargetShelfIndex] = useState(0);

  if (selectedCount === 0) return null;

  const targetCab = cabinets[targetCabIndex] || cabinets[0];

  return (
    <div className="sticky bottom-16 md:bottom-4 z-30 bg-gradient-to-r from-purple-950 to-indigo-950 border border-purple-500/60 rounded-xl p-3 shadow-2xl flex items-center justify-between flex-wrap gap-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="bg-purple-600 text-white font-bold px-2 py-0.5 rounded-full text-xs">
          {selectedCount}
        </span>
        <span className="font-bold text-purple-200">
          รายการที่เลือก ย้ายไปที่:
        </span>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={targetCabIndex}
          onChange={(e) => {
            setTargetCabIndex(parseInt(e.target.value, 10));
            setTargetShelfIndex(0);
          }}
          className="bg-slate-950 border border-purple-700 text-white px-2.5 py-1.5 rounded-md text-xs"
        >
          {cabinets.map((c, i) => (
            <option key={c.id || i} value={i}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={targetShelfIndex}
          onChange={(e) => setTargetShelfIndex(parseInt(e.target.value, 10))}
          className="bg-slate-950 border border-purple-700 text-white px-2.5 py-1.5 rounded-md text-xs"
        >
          {targetCab?.shelves.map((s, i) => (
            <option key={s.id || i} value={i}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={() => onExecuteBulkMove(targetCabIndex, targetShelfIndex)}
          className="inline-flex items-center gap-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-md shadow-xs transition-colors"
        >
          <Rocket className="w-3.5 h-3.5" />
          🚀 ย้ายทันที
        </button>

        <button
          type="button"
          onClick={onClearSelection}
          className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white px-2 py-1.5 rounded-md transition-colors"
          title="ยกเลิกการเลือก"
        >
          <X className="w-3.5 h-3.5" />
          ยกเลิก
        </button>
      </div>
    </div>
  );
};
