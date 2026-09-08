import React, { useState } from 'react';
import { Search, Rocket, Trash2, CopyCheck, Table, LayoutGrid, Plus } from 'lucide-react';
import { Cabinet, Item, PrintSettings } from '../types';
import { ItemCard } from './ItemCard';

interface UnassignedViewProps {
  unassignedItems: Item[];
  cabinets: Cabinet[];
  theme: PrintSettings['cardTheme'];
  isCountMode: boolean;
  onOpenImportExcel: () => void;
  onOpenDuplicateModal: () => void;
  onAssignItemsToShelf: (itemUids: string[], cabIndex: number, shelfIndex: number) => void;
  onDeleteUnassignedItems: (itemUids: string[]) => void;
  onOpenEditItem: (item: Item) => void;
  onOpenLightbox: (imgSrc: string, name: string, code: string) => void;
  onAddNewUnassignedItem: () => void;
}

export const UnassignedView: React.FC<UnassignedViewProps> = ({
  unassignedItems,
  cabinets,
  theme,
  isCountMode,
  onOpenImportExcel,
  onOpenDuplicateModal,
  onAssignItemsToShelf,
  onDeleteUnassignedItems,
  onOpenEditItem,
  onOpenLightbox,
  onAddNewUnassignedItem,
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [selectedCabIndex, setSelectedCabIndex] = useState(0);
  const [selectedShelfIndex, setSelectedShelfIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const filteredItems = unassignedItems.filter((item) => {
    if (!searchKeyword) return true;
    const kw = searchKeyword.toLowerCase();
    return item.code.toLowerCase().includes(kw) || item.name.toLowerCase().includes(kw);
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUids(filteredItems.map((it) => it.uid));
    } else {
      setSelectedUids([]);
    }
  };

  const handleToggleSelectOne = (uid: string, checked: boolean) => {
    setSelectedUids((prev) => (checked ? [...prev, uid] : prev.filter((id) => id !== uid)));
  };

  const handleAssignSelected = () => {
    if (selectedUids.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการจัดเข้าชั้นวาง');
      return;
    }
    onAssignItemsToShelf(selectedUids, selectedCabIndex, selectedShelfIndex);
    setSelectedUids([]);
  };

  const handleDeleteSelected = () => {
    if (selectedUids.length === 0) {
      alert('กรุณาเลือกรายการที่ต้องการลบ');
      return;
    }
    if (confirm(`คุณต้องการลบรายการที่เลือกจำนวน ${selectedUids.length} รายการ ออกจากของนอกคลังใช่หรือไม่?`)) {
      onDeleteUnassignedItems(selectedUids);
      setSelectedUids([]);
    }
  };

  const targetCab = cabinets[selectedCabIndex] || cabinets[0];

  return (
    <div className="bg-slate-900 border border-purple-900/60 rounded-xl p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-purple-950">
        <div className="flex items-center gap-2">
          <span className="text-xl">📦</span>
          <div>
            <h3 className="text-base font-bold text-purple-300">
              ของนอกคลัง / รายการรอนำเข้า
            </h3>
            <p className="text-xs text-slate-400">
              รายการสิ่งของที่นำเข้าจาก Excel หรือยังไม่ได้ระบุตำแหน่งตู้และชั้นวาง
            </p>
          </div>
          <span className="bg-purple-900 text-purple-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {unassignedItems.length} รายการ
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onAddNewUnassignedItem}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            + เพิ่มรายการ
          </button>
          <button
            type="button"
            onClick={onOpenImportExcel}
            className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md"
          >
            📥 นำเข้า Excel โรงพยาบาล
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-slate-950 p-3 rounded-lg border border-purple-950/80 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-sm">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
              placeholder="ค้นหารหัส หรือ ชื่อ ในของนอกคลัง..."
              className="w-full bg-slate-900 border border-slate-700 text-white pl-8 pr-3 py-1.5 rounded-md text-xs focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-1 bg-slate-900 p-1 rounded-md border border-slate-800">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'table' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Table className="w-3 h-3" />
              ตาราง
            </button>
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-semibold ${
                viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              การ์ด
            </button>
          </div>
        </div>

        {/* Batch assignment controls */}
        <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-900 text-xs">
          <span className="text-slate-400 font-medium">จัดเข้า:</span>
          <select
            value={selectedCabIndex}
            onChange={(e) => {
              setSelectedCabIndex(parseInt(e.target.value, 10));
              setSelectedShelfIndex(0);
            }}
            className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded-md max-w-[180px]"
          >
            {cabinets.map((c, i) => (
              <option key={c.id || i} value={i}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={selectedShelfIndex}
            onChange={(e) => setSelectedShelfIndex(parseInt(e.target.value, 10))}
            className="bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded-md max-w-[180px]"
          >
            {targetCab?.shelves.map((s, i) => (
              <option key={s.id || i} value={i}>
                {s.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAssignSelected}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1 rounded-md shadow-xs transition-colors"
          >
            <Rocket className="w-3 h-3" />
            จัดเข้าชั้นวางที่เลือก ({selectedUids.length})
          </button>

          <button
            type="button"
            onClick={handleDeleteSelected}
            className="inline-flex items-center gap-1 bg-red-800 hover:bg-red-700 text-white font-bold px-2.5 py-1 rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3" />
            ลบที่เลือก
          </button>

          <button
            type="button"
            onClick={onOpenDuplicateModal}
            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-black font-bold px-2.5 py-1 rounded-md transition-colors ml-auto"
          >
            <CopyCheck className="w-3 h-3" />
            ตรวจสอบรายการซ้ำ
          </button>
        </div>
      </div>

      {/* Content: Table or Grid */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto max-h-96 border border-slate-800 rounded-lg">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-950 text-purple-300 sticky top-0">
              <tr>
                <th className="p-2.5 border-b border-slate-800 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={filteredItems.length > 0 && selectedUids.length === filteredItems.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                  />
                </th>
                <th className="p-2.5 border-b border-slate-800 w-32">รหัสสิ่งของ</th>
                <th className="p-2.5 border-b border-slate-800">ชื่อสิ่งของ</th>
                <th className="p-2.5 border-b border-slate-800 text-center w-24">จำนวน</th>
                <th className="p-2.5 border-b border-slate-800 text-center w-36">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-500">
                    ไม่พบรายการในของนอกคลัง
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.uid} className="hover:bg-slate-950/60">
                    <td className="p-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={selectedUids.includes(item.uid)}
                        onChange={(e) => handleToggleSelectOne(item.uid, e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-purple-600 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-2.5 font-mono font-bold text-purple-400">{item.code}</td>
                    <td className="p-2.5">
                      <div className="flex items-center gap-2">
                        {item.img && (
                          <img
                            src={item.img}
                            alt={item.name}
                            onClick={() => onOpenLightbox(item.img!, item.name, item.code)}
                            className="w-6 h-6 rounded object-cover cursor-zoom-in border border-slate-700 shrink-0"
                          />
                        )}
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-center font-bold font-mono">
                      {item.qty} {item.unit}
                    </td>
                    <td className="p-2.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onAssignItemsToShelf([item.uid], selectedCabIndex, selectedShelfIndex)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2 py-0.5 rounded text-[11px]"
                          title="จัดเก็บเข้าชั้นวางที่เลือก"
                        >
                          📥 จัดเก็บ
                        </button>
                        <button
                          type="button"
                          onClick={() => onOpenEditItem(item)}
                          className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded text-[11px]"
                          title="แก้ไข"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`ลบ "${item.name}" ออกจากของนอกคลังหรือไม่?`)) {
                              onDeleteUnassignedItems([item.uid]);
                            }
                          }}
                          className="bg-red-800 hover:bg-red-700 text-white px-1.5 py-0.5 rounded text-[11px]"
                          title="ลบ"
                        >
                          ✕
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2.5 p-3 bg-slate-950 rounded-lg border border-purple-950 min-h-[140px] items-start">
          {filteredItems.length === 0 ? (
            <div className="w-full text-center py-6 text-slate-500 text-xs">
              ไม่พบรายการในของนอกคลัง
            </div>
          ) : (
            filteredItems.map((item) => (
              <ItemCard
                key={item.uid}
                item={item}
                isCountMode={isCountMode}
                isSelected={selectedUids.includes(item.uid)}
                theme={theme}
                onSelectChange={(selected) => handleToggleSelectOne(item.uid, selected)}
                onOpenEdit={() => onOpenEditItem(item)}
                onQuickQtyChange={() => {}}
                onMarkCounted={() => {}}
                onOpenLightbox={onOpenLightbox}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
