import React from 'react';
import { Item, PrintSettings } from '../types';
import { checkExpStatus } from '../utils/helpers';

interface ItemCardProps {
  item: Item;
  isCountMode: boolean;
  isSelected: boolean;
  isHighlighted?: boolean;
  theme: PrintSettings['cardTheme'];
  onSelectChange: (selected: boolean) => void;
  onOpenEdit: () => void;
  onQuickQtyChange: (delta: number, actionType: 'เบิกใช้' | 'เติมของ') => void;
  onMarkCounted: () => void;
  onOpenLightbox: (imgSrc: string, name: string, code: string) => void;
  onContextMenu?: (e: React.MouseEvent) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({
  item,
  isCountMode,
  isSelected,
  isHighlighted,
  theme,
  onSelectChange,
  onOpenEdit,
  onQuickQtyChange,
  onMarkCounted,
  onOpenLightbox,
  onContextMenu,
}) => {
  const expInfo = checkExpStatus(item.exp);
  const isUrgent = item.qty <= item.min && item.min < item.max;

  // Theme color maps for card background and border
  const getThemeStyles = () => {
    switch (theme) {
      case 'cyber-blue':
        return {
          bg: 'bg-[#00e5ff]',
          text: 'text-slate-950',
          border: 'border-[#00b0ff]',
          badgeBg: 'bg-[#002984]',
          badgeText: 'text-[#00e5ff]',
        };
      case 'deep-purple':
        return {
          bg: 'bg-[#ab47bc]',
          text: 'text-white',
          border: 'border-[#7b1fa2]',
          badgeBg: 'bg-[#1a0033]',
          badgeText: 'text-[#ea80fc]',
        };
      case 'emerald-green':
        return {
          bg: 'bg-[#00e676]',
          text: 'text-slate-950',
          border: 'border-[#00c853]',
          badgeBg: 'bg-[#003311]',
          badgeText: 'text-[#00e676]',
        };
      case 'dark-grey':
        return {
          bg: 'bg-[#333333]',
          text: 'text-white',
          border: 'border-[#555555]',
          badgeBg: 'bg-[#111111]',
          badgeText: 'text-[#ffd700]',
        };
      case 'gold':
      default:
        return {
          bg: 'bg-[#ffd700]',
          text: 'text-slate-950',
          border: 'border-[#e6c200]',
          badgeBg: 'bg-black/90',
          badgeText: 'text-[#ffd700]',
        };
    }
  };

  const currentTheme = getThemeStyles();
  const hasImg = Boolean(item.img);

  return (
    <div
      onContextMenu={onContextMenu}
      onClick={onOpenEdit}
      className={`relative rounded-xl border-2 transition-all duration-150 select-none cursor-pointer flex flex-col justify-between items-center text-center p-2 pt-5 pb-7 shrink-0 ${
        hasImg ? 'w-28 h-40' : 'w-28 h-28'
      } ${currentTheme.bg} ${currentTheme.text} ${currentTheme.border} ${
        isSelected ? 'ring-3 ring-purple-500 shadow-lg scale-102' : ''
      } ${isHighlighted ? 'ring-4 ring-emerald-400 animate-pulse scale-105' : ''} ${
        isCountMode && !item.isCounted
          ? 'ring-2 ring-pink-500 animate-pulse'
          : isCountMode && item.isCounted
          ? 'opacity-65 grayscale-30'
          : ''
      } hover:scale-102 hover:shadow-md`}
    >
      {/* Urgent low stock badge */}
      {isUrgent && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap z-20">
          🚨 เติมของ ({item.qty}/{item.max})
        </div>
      )}

      {/* Select checkbox */}
      <input
        type="checkbox"
        checked={isSelected}
        onChange={(e) => {
          e.stopPropagation();
          onSelectChange(e.target.checked);
        }}
        onClick={(e) => e.stopPropagation()}
        className="absolute top-1.5 left-1.5 w-4 h-4 rounded text-purple-600 focus:ring-0 z-10 cursor-pointer"
      />

      {/* Code badge */}
      <div
        className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold max-w-[65px] truncate z-10 ${currentTheme.badgeBg} ${currentTheme.badgeText}`}
      >
        {item.code}
      </div>

      {/* Expiry badge if applicable */}
      {item.exp && expInfo.status !== 'none' && (
        <div
          className={`absolute top-5 right-1 px-1 py-0.2 rounded text-[8px] font-bold z-10 ${
            expInfo.status === 'expired'
              ? 'bg-red-600 text-white animate-pulse'
              : expInfo.status === 'near-exp'
              ? 'bg-amber-500 text-black'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {expInfo.label}
        </div>
      )}

      {/* Image thumbnail */}
      {hasImg && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onOpenLightbox(item.img!, item.name, item.code);
          }}
          className="w-14 h-11 rounded-md overflow-hidden my-0.5 border border-black/30 bg-white flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-zoom-in shadow-xs"
          title="คลิกเพื่อดูรูปขยาย"
        >
          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Item Name */}
      <div className="font-bold text-[10.5px] leading-tight line-clamp-2 px-1 w-full my-auto">
        {item.name}
      </div>

      {/* Last counted time badge */}
      <div className="text-[8px] font-semibold opacity-85 truncate w-full px-1">
        {item.lastUpdated ? `นับ: ${item.lastUpdated}` : 'ยังไม่ตรวจนับ'}
      </div>

      {/* Bottom Bar: Stepper and Quick check */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1"
      >
        <div className="flex items-center bg-black/85 text-white rounded px-1 py-0.5 shadow-xs">
          <button
            type="button"
            onClick={() => onQuickQtyChange(-1, 'เบิกใช้')}
            className="w-4 h-4 flex items-center justify-center text-xs font-bold hover:text-amber-400 active:scale-90"
            title="ลดจำนวน (เบิกใช้)"
          >
            -
          </button>
          <span className="text-[10.5px] font-bold text-amber-300 px-1 min-w-4 text-center font-mono">
            {item.qty}
          </span>
          <button
            type="button"
            onClick={() => onQuickQtyChange(1, 'เติมของ')}
            className="w-4 h-4 flex items-center justify-center text-xs font-bold hover:text-amber-400 active:scale-90"
            title="เพิ่มจำนวน (เติมของ)"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={onMarkCounted}
          className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold w-5 h-5 rounded flex items-center justify-center text-xs shadow-xs"
          title="ทำเครื่องหมายว่านับแล้ว"
        >
          ✓
        </button>
      </div>
    </div>
  );
};
