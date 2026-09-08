import React, { useState } from 'react';
import { Search, MapPin } from 'lucide-react';
import { WardData } from '../types';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  allWardsData: Record<string, WardData>;
  onNavigateToItem: (ward: string, cabIndex: number, shelfIndex: number, itemUid: string) => void;
  onOpenLightbox: (imgSrc: string, name: string, code: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  allWardsData,
  onNavigateToItem,
  onOpenLightbox,
}) => {
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  // Search results
  const results: {
    ward: string;
    cabIndex: number;
    shelfIndex: number;
    cabName: string;
    shelfName: string;
    item: any;
  }[] = [];

  const q = query.trim().toLowerCase();
  if (q) {
    (Object.entries(allWardsData) as [string, WardData][]).forEach(([wardName, ward]) => {
      ward.cabinets.forEach((cab, cIdx) => {
        cab.shelves.forEach((shelf, sIdx) => {
          shelf.items.forEach((it) => {
            const code = (it.code || '').toLowerCase();
            const name = (it.name || '').toLowerCase();
            const lot = (it.lot || '').toLowerCase();
            if (code.includes(q) || name.includes(q) || lot.includes(q)) {
              results.push({
                ward: wardName,
                cabIndex: cIdx,
                shelfIndex: sIdx,
                cabName: cab.name,
                shelfName: shelf.name,
                item: it,
              });
            }
          });
        });
      });
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-amber-400">ค้นหาตำแหน่งของ</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Input */}
        <div className="p-4 border-b border-slate-800 bg-slate-950">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="พิมพ์ชื่อ, รหัสสิ่งของ หรือ Lot No. เพื่อค้นหา..."
              className="w-full bg-slate-900 border border-slate-700 text-white pl-9 pr-4 py-2 rounded-lg text-xs focus:border-amber-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Results */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 text-xs">
          {!q ? (
            <div className="text-center py-8 text-slate-500">
              พิมพ์ชื่อหรือรหัสเวชภัณฑ์ในช่องด้านบนเพื่อค้นหา
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-8 text-red-400">
              ❌ ไม่พบสิ่งของที่ค้นหา
            </div>
          ) : (
            results.map((res, i) => (
              <div
                key={i}
                className="bg-slate-950 border border-slate-800 hover:border-amber-400/80 p-3 rounded-lg flex items-center justify-between gap-2 transition-colors border-l-4 border-l-amber-400"
              >
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {res.item.img && (
                    <img
                      src={res.item.img}
                      alt={res.item.name}
                      onClick={() => onOpenLightbox(res.item.img, res.item.name, res.item.code)}
                      className="w-10 h-10 rounded-md object-cover border border-slate-700 cursor-zoom-in shrink-0"
                    />
                  )}
                  <div className="overflow-hidden">
                    <div className="font-bold text-amber-300 truncate">
                      [{res.item.code}] {res.item.name}
                    </div>
                    <div className="text-[11px] text-emerald-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">
                        {res.ward} ➔ {res.cabName} ➔ {res.shelfName}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      จำนวนคงเหลือ: <b className="text-white">{res.item.qty}</b> {res.item.unit || 'ชิ้น'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onNavigateToItem(res.ward, res.cabIndex, res.shelfIndex, res.item.uid);
                    onClose();
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-3 py-1.5 rounded text-xs shrink-0 inline-flex items-center gap-1 shadow-sm"
                >
                  🎯 ชี้ตำแหน่ง
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-1.5 rounded-lg text-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
