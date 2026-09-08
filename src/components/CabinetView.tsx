import React, { useState } from 'react';
import {
  Plus,
  ArrowUp,
  ArrowDown,
  Printer,
  Table,
  LayoutGrid,
  Trash2,
  FolderInput,
} from 'lucide-react';
import { Cabinet, Item, PrintSettings, Shelf } from '../types';
import { ItemCard } from './ItemCard';

interface CabinetViewProps {
  cabinets: Cabinet[];
  currentCabIndex: number;
  isCountMode: boolean;
  selectedUids: string[];
  theme: PrintSettings['cardTheme'];
  highlightUid?: string | null;
  onSelectCabinet: (index: number) => void;
  onAddCabinet: () => void;
  onRenameCabinet: (cabIndex: number, newName: string) => void;
  onDeleteCabinet: (cabIndex: number) => void;
  onInsertCabinet: (cabIndex: number) => void;
  onAddShelf: (cabIndex: number) => void;
  onRenameShelf: (cabIndex: number, shelfIndex: number, newName: string) => void;
  onMoveShelfOrder: (cabIndex: number, shelfIndex: number, direction: 'up' | 'down') => void;
  onDeleteShelf: (cabIndex: number, shelfIndex: number) => void;
  onClearShelf: (cabIndex: number, shelfIndex: number) => void;
  onMoveShelfToCabinet: (cabIndex: number, shelfIndex: number, targetCabIndex: number) => void;
  onAddItemToShelf: (cabIndex: number, shelfIndex: number) => void;
  onToggleItemSelect: (uid: string, selected: boolean) => void;
  onOpenEditItem: (item: Item) => void;
  onQuickQtyChange: (item: Item, delta: number, actionType: 'เบิกใช้' | 'เติมของ') => void;
  onMarkItemCounted: (item: Item) => void;
  onOpenLightbox: (imgSrc: string, name: string, code: string) => void;
  onPrintShelf: (shelf: Shelf) => void;
}

export const CabinetView: React.FC<CabinetViewProps> = ({
  cabinets,
  currentCabIndex,
  isCountMode,
  selectedUids,
  theme,
  highlightUid,
  onSelectCabinet,
  onAddCabinet,
  onRenameCabinet,
  onDeleteCabinet,
  onInsertCabinet,
  onAddShelf,
  onRenameShelf,
  onMoveShelfOrder,
  onDeleteShelf,
  onClearShelf,
  onMoveShelfToCabinet,
  onAddItemToShelf,
  onToggleItemSelect,
  onOpenEditItem,
  onQuickQtyChange,
  onMarkItemCounted,
  onOpenLightbox,
  onPrintShelf,
}) => {
  const [quickFilter, setQuickFilter] = useState<'all' | 'low' | 'uncounted' | 'exp'>('all');
  const [shelfViewModes, setShelfViewModes] = useState<Record<string, 'grid' | 'table'>>({});
  const [movingShelfInfo, setMovingShelfInfo] = useState<{ cabIndex: number; shelfIndex: number } | null>(null);

  const activeCab = cabinets[currentCabIndex] || cabinets[0];

  const filterItem = (item: Item): boolean => {
    if (quickFilter === 'all') return true;
    if (quickFilter === 'low') return item.qty <= item.min && item.min < item.max;
    if (quickFilter === 'uncounted') return !item.isCounted;
    if (quickFilter === 'exp') {
      if (!item.exp) return false;
      const today = new Date();
      const expDate = new Date(item.exp);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return diffDays <= 90;
    }
    return true;
  };

  const toggleShelfViewMode = (shelfId: string) => {
    setShelfViewModes((prev) => ({
      ...prev,
      [shelfId]: prev[shelfId] === 'table' ? 'grid' : 'table',
    }));
  };

  return (
    <div className="space-y-4">
      {/* Quick Filter Bar */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-2 rounded-lg border border-slate-800 flex-wrap">
        <span className="text-xs font-bold text-amber-400 pl-1">🎯 ตัวกรองด่วน:</span>
        <button
          type="button"
          onClick={() => setQuickFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            quickFilter === 'all'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ดูทั้งหมด
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('low')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            quickFilter === 'low'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🚨 ของขาด (ต่ำกว่า MIN)
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('uncounted')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            quickFilter === 'uncounted'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          🌈 ยังไม่ได้นับ
        </button>
        <button
          type="button"
          onClick={() => setQuickFilter('exp')}
          className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
            quickFilter === 'exp'
              ? 'bg-amber-400 text-slate-950'
              : 'bg-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ⚠️ หมดอายุ / ใกล้หมด
        </button>
      </div>

      {/* Cabinet Tabs Switcher */}
      <div className="flex gap-2 overflow-x-auto pb-1 border-b border-slate-800 scrollbar-thin">
        {cabinets.map((cab, idx) => (
          <button
            key={cab.id || idx}
            type="button"
            onClick={() => onSelectCabinet(idx)}
            className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all border ${
              idx === currentCabIndex
                ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md scale-102'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
            }`}
          >
            🏢 {cab.name}
          </button>
        ))}
      </div>

      {/* Current Cabinet Container */}
      {activeCab ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
          {/* Cabinet Header */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
            <input
              type="text"
              value={activeCab.name}
              onChange={(e) => onRenameCabinet(currentCabIndex, e.target.value)}
              className="bg-slate-950 border border-slate-700 text-white font-bold text-sm px-3 py-1 rounded-md max-w-sm focus:border-amber-400 focus:outline-none"
              title="คลิกเพื่อแก้ไขชื่อตู้"
            />

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => onInsertCabinet(currentCabIndex)}
                className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded text-xs transition-colors"
                title="แทรกตู้ใหม่ก่อนหน้านี้"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                แทรกตู้
              </button>

              <button
                type="button"
                onClick={() => {
                  if (cabinets.length > 1) {
                    if (confirm(`คุณต้องการลบ "${activeCab.name}" และชั้นทั้งหมดภายในตู้หรือไม่?`)) {
                      onDeleteCabinet(currentCabIndex);
                    }
                  } else {
                    alert('ต้องมีอย่างน้อย 1 ตู้ในระบบ');
                  }
                }}
                className="inline-flex items-center gap-1 bg-red-900/40 hover:bg-red-800 text-red-300 px-2.5 py-1 rounded text-xs transition-colors"
                title="ลบตู้นี้"
              >
                <Trash2 className="w-3.5 h-3.5" />
                ลบตู้
              </button>
            </div>
          </div>

          {/* Shelves List */}
          <div className="space-y-4">
            {activeCab.shelves.map((shelf, shelfIdx) => {
              const viewMode = shelfViewModes[shelf.id] || 'grid';
              const filteredItems = shelf.items.filter(filterItem);

              return (
                <div
                  key={shelf.id || shelfIdx}
                  className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-3"
                >
                  {/* Shelf Header */}
                  <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-900 px-3 py-1.5 rounded-md border border-slate-800">
                    <input
                      type="text"
                      value={shelf.name}
                      onChange={(e) => onRenameShelf(currentCabIndex, shelfIdx, e.target.value)}
                      className="bg-transparent text-slate-100 font-bold text-xs px-1 py-0.5 border-b border-transparent focus:border-amber-400 focus:outline-none"
                    />

                    <div className="flex items-center gap-1 flex-wrap text-xs">
                      <button
                        type="button"
                        onClick={() => toggleShelfViewMode(shelf.id)}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px]"
                      >
                        {viewMode === 'grid' ? (
                          <>
                            <Table className="w-3 h-3 text-sky-400" />
                            ตาราง
                          </>
                        ) : (
                          <>
                            <LayoutGrid className="w-3 h-3 text-amber-400" />
                            การ์ด
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMovingShelfInfo({ cabIndex: currentCabIndex, shelfIndex: shelfIdx })}
                        className="inline-flex items-center gap-1 bg-purple-900/40 hover:bg-purple-800 text-purple-200 px-2 py-0.5 rounded text-[11px]"
                        title="ย้ายชั้นนี้ไปตู้อื่น"
                      >
                        <FolderInput className="w-3 h-3" />
                        ย้ายตู้
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveShelfOrder(currentCabIndex, shelfIdx, 'up')}
                        disabled={shelfIdx === 0}
                        className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300"
                        title="เลื่อนขึ้น"
                      >
                        <ArrowUp className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onMoveShelfOrder(currentCabIndex, shelfIdx, 'down')}
                        disabled={shelfIdx === activeCab.shelves.length - 1}
                        className="p-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded text-slate-300"
                        title="เลื่อนลง"
                      >
                        <ArrowDown className="w-3 h-3" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onPrintShelf(shelf)}
                        className="inline-flex items-center gap-1 bg-blue-900/40 hover:bg-blue-800 text-blue-200 px-2 py-0.5 rounded text-[11px]"
                        title="พิมพ์ใบเฉพาะชั้นนี้"
                      >
                        <Printer className="w-3 h-3" />
                        พิมพ์
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`ต้องการล้างสิ่งของทั้งหมดใน "${shelf.name}" หรือไม่?`)) {
                            onClearShelf(currentCabIndex, shelfIdx);
                          }
                        }}
                        className="inline-flex items-center gap-1 bg-slate-800 hover:bg-red-900 text-slate-300 hover:text-red-200 px-2 py-0.5 rounded text-[11px]"
                        title="ล้างของในชั้น"
                      >
                        ล้างชั้น
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          if (activeCab.shelves.length > 1) {
                            if (confirm(`ลบ "${shelf.name}" หรือไม่?`)) {
                              onDeleteShelf(currentCabIndex, shelfIdx);
                            }
                          } else {
                            alert('ต้องมีอย่างน้อย 1 ชั้นในตู้');
                          }
                        }}
                        className="p-1 bg-slate-800 hover:bg-red-700 text-red-400 hover:text-white rounded"
                        title="ลบชั้นนี้"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* Shelf Items Area */}
                  {viewMode === 'grid' ? (
                    <div className="flex flex-wrap gap-2.5 p-2 bg-slate-950 rounded-lg border border-dashed border-slate-800 min-h-[120px] items-start">
                      {filteredItems.map((item) => (
                        <ItemCard
                          key={item.uid}
                          item={item}
                          isCountMode={isCountMode}
                          isSelected={selectedUids.includes(item.uid)}
                          isHighlighted={highlightUid === item.uid}
                          theme={theme}
                          onSelectChange={(selected) => onToggleItemSelect(item.uid, selected)}
                          onOpenEdit={() => onOpenEditItem(item)}
                          onQuickQtyChange={(delta, actionType) => onQuickQtyChange(item, delta, actionType)}
                          onMarkCounted={() => onMarkItemCounted(item)}
                          onOpenLightbox={onOpenLightbox}
                        />
                      ))}

                      {/* Add Item Button inside Shelf */}
                      <button
                        type="button"
                        onClick={() => onAddItemToShelf(currentCabIndex, shelfIdx)}
                        className="w-28 h-28 rounded-xl border-2 border-dashed border-slate-700 hover:border-amber-400 bg-slate-900/50 hover:bg-slate-900 text-slate-400 hover:text-amber-400 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer"
                        title="เพิ่มสิ่งของใหม่ในชั้นนี้"
                      >
                        <Plus className="w-6 h-6" />
                        <span className="text-[11px] font-semibold">เพิ่มสิ่งของ</span>
                      </button>
                    </div>
                  ) : (
                    /* Table View */
                    <div className="overflow-x-auto max-h-72 border border-slate-800 rounded-lg">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-slate-900 text-amber-400 sticky top-0">
                          <tr>
                            <th className="p-2 border-b border-slate-800 w-12 text-center">เลือก</th>
                            <th className="p-2 border-b border-slate-800">รหัสสิ่งของ</th>
                            <th className="p-2 border-b border-slate-800">ชื่อสิ่งของ</th>
                            <th className="p-2 border-b border-slate-800 text-center">คงเหลือ</th>
                            <th className="p-2 border-b border-slate-800 text-center">MIN/MAX</th>
                            <th className="p-2 border-b border-slate-800">วันหมดอายุ</th>
                            <th className="p-2 border-b border-slate-800 text-center">จัดการ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-slate-200">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={7} className="p-4 text-center text-slate-500">
                                ไม่มีรายการสิ่งของ
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item) => (
                              <tr key={item.uid} className="hover:bg-slate-900/60">
                                <td className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={selectedUids.includes(item.uid)}
                                    onChange={(e) => onToggleItemSelect(item.uid, e.target.checked)}
                                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                                  />
                                </td>
                                <td className="p-2 font-mono font-bold text-amber-300">{item.code}</td>
                                <td className="p-2">
                                  <div className="flex items-center gap-2">
                                    {item.img && (
                                      <img
                                        src={item.img}
                                        alt={item.name}
                                        onClick={() => onOpenLightbox(item.img!, item.name, item.code)}
                                        className="w-7 h-7 rounded object-cover cursor-zoom-in border border-slate-700"
                                      />
                                    )}
                                    <span>{item.name}</span>
                                  </div>
                                </td>
                                <td className="p-2 text-center font-bold font-mono">
                                  {item.qty} {item.unit}
                                </td>
                                <td className="p-2 text-center text-slate-400">
                                  {item.min}/{item.max}
                                </td>
                                <td className="p-2 text-slate-300">{item.exp || '-'}</td>
                                <td className="p-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => onOpenEditItem(item)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-2.5 py-1 rounded text-[11px] font-semibold"
                                  >
                                    ✏️ แก้ไข
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Add Shelf Button */}
          <button
            type="button"
            onClick={() => onAddShelf(currentCabIndex)}
            className="w-full py-2.5 border border-dashed border-amber-400/60 hover:border-amber-400 bg-slate-950/50 hover:bg-slate-950 text-amber-400 font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" />+ เพิ่มชั้นในตู้นี้
          </button>
        </div>
      ) : null}

      {/* Add New Cabinet Button */}
      <button
        type="button"
        onClick={onAddCabinet}
        className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-sm transition-colors shadow-lg"
      >
        + เพิ่ม ตู้/ชั้น ใหม่
      </button>

      {/* Move Shelf to another Cabinet Modal */}
      {movingShelfInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-4 space-y-4">
            <h4 className="font-bold text-base text-amber-400">📦 ย้ายชั้นวางไปยังตู้อื่น</h4>
            <div>
              <label className="block text-xs text-slate-300 mb-1">เลือกตู้ปลายทาง:</label>
              <select
                id="targetCabSelectInput"
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-2 rounded-md text-xs"
              >
                {cabinets.map((c, i) => (
                  <option key={c.id || i} value={i} disabled={i === movingShelfInfo.cabIndex}>
                    {c.name} {i === movingShelfInfo.cabIndex ? '(ตู้ปัจจุบัน)' : ''}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setMovingShelfInfo(null)}
                className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded text-xs"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  const sel = document.getElementById('targetCabSelectInput') as HTMLSelectElement;
                  const targetIndex = parseInt(sel.value, 10);
                  onMoveShelfToCabinet(movingShelfInfo.cabIndex, movingShelfInfo.shelfIndex, targetIndex);
                  setMovingShelfInfo(null);
                }}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-1.5 rounded text-xs"
              >
                ย้ายชั้นวาง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
