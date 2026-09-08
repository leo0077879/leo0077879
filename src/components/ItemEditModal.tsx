import React, { useState, useEffect } from 'react';
import { Camera, Trash2, Link, Image as ImageIcon } from 'lucide-react';
import { Item } from '../types';
import { compressImageFile } from '../utils/helpers';

interface ItemEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Item | null;
  onSave: (updatedItem: Item, actionType: 'ตรวจนับ' | 'เบิกใช้' | 'เติมของ' | 'ปรับปรุงยอด', note: string) => void;
  onOpenLightbox: (imgSrc: string, name: string, code: string) => void;
}

export const ItemEditModal: React.FC<ItemEditModalProps> = ({
  isOpen,
  onClose,
  item,
  onSave,
  onOpenLightbox,
}) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [qty, setQty] = useState<number>(0);
  const [min, setMin] = useState<number>(0);
  const [max, setMax] = useState<number>(10);
  const [unit, setUnit] = useState('ชิ้น');
  const [exp, setExp] = useState('');
  const [lot, setLot] = useState('');
  const [img, setImg] = useState('');
  const [actionType, setActionType] = useState<'ตรวจนับ' | 'เบิกใช้' | 'เติมของ' | 'ปรับปรุงยอด'>('ตรวจนับ');
  const [note, setNote] = useState('');
  const [allowEditMinMax, setAllowEditMinMax] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [urlInputVal, setUrlInputVal] = useState('');

  useEffect(() => {
    if (item) {
      setCode(item.code || '');
      setName(item.name || '');
      setQty(item.qty || 0);
      setMin(item.min || 0);
      setMax(item.max || 10);
      setUnit(item.unit || 'ชิ้น');
      setExp(item.exp || '');
      setLot(item.lot || '');
      setImg(item.img || '');
      setActionType('ตรวจนับ');
      setNote('');
      setAllowEditMinMax(false);
      setShowUrlInput(false);
      setUrlInputVal('');
    }
  }, [item, isOpen]);

  // Handle Ctrl+V paste image from clipboard
  useEffect(() => {
    if (!isOpen) return;

    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const blob = items[i].getAsFile();
          if (blob) {
            compressImageFile(blob, (base64) => {
              setImg(base64);
            });
            e.preventDefault();
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  if (!isOpen || !item) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      compressImageFile(file, (base64) => {
        setImg(base64);
      });
    }
  };

  const handleApplyUrl = () => {
    if (urlInputVal.trim()) {
      setImg(urlInputVal.trim());
      setShowUrlInput(false);
    }
  };

  const handleSave = () => {
    const updated: Item = {
      ...item,
      code: code.trim() || 'ITEM',
      name: name.trim() || 'สิ่งของ',
      qty: Number(qty) || 0,
      min: Number(min) || 0,
      max: Number(max) || 10,
      unit: unit.trim() || 'ชิ้น',
      exp: exp.trim(),
      lot: lot.trim(),
      img: img || '',
    };
    onSave(updated, actionType, note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <span className="text-lg">📦</span>
            <h3 className="text-base font-bold text-amber-400">กรอกจำนวน / แก้ไขรายละเอียด</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-3.5 text-xs">
          {/* Code and Name */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-1">
              <label className="block text-slate-300 font-semibold mb-1">รหัสสิ่งของ (Code):</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-amber-300 font-bold px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-slate-300 font-semibold mb-1">ชื่อสิ่งของ (Name):</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Photo upload section */}
          <div className="bg-slate-950/80 border border-blue-500/40 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-400 font-bold flex items-center gap-1.5 text-xs">
                <Camera className="w-3.5 h-3.5" />
                รูปภาพสิ่งของ (ถ่ายรูป / เลือกไฟล์ / วางภาพ):
              </span>
              {img && (
                <button
                  type="button"
                  onClick={() => setImg('')}
                  className="inline-flex items-center gap-1 bg-red-600/80 hover:bg-red-600 text-white px-2 py-0.5 rounded text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  ลบรูป
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div
                onClick={() => (img ? onOpenLightbox(img, name, code) : null)}
                className="w-20 h-20 rounded-lg border-2 border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-sky-400 transition-colors"
                title={img ? 'คลิกเพื่อดูรูปขนาดเต็ม' : 'ยังไม่มีรูปภาพ'}
              >
                {img ? (
                  <img src={img} alt="รูปสิ่งของ" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-slate-500">
                    <ImageIcon className="w-6 h-6 mx-auto mb-0.5" />
                    <span className="text-[9px]">ไม่มีรูป</span>
                  </div>
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold px-2.5 py-1.5 rounded cursor-pointer text-xs">
                    <Camera className="w-3.5 h-3.5" />
                    ถ่าย / เลือกรูป
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded text-xs"
                  >
                    <Link className="w-3.5 h-3.5" />
                    ใส่ URL
                  </button>
                </div>

                <p className="text-[10.5px] text-slate-400">
                  💡 ถ่ายรูปจากกล้องมือถือได้ทันที หรือกด{' '}
                  <kbd className="bg-slate-800 text-sky-300 px-1 py-0.5 rounded text-[10px]">
                    Ctrl+V
                  </kbd>{' '}
                  เพื่อวางภาพที่คัดลอกมา
                </p>

                {showUrlInput && (
                  <div className="flex gap-1.5 pt-1">
                    <input
                      type="url"
                      value={urlInputVal}
                      onChange={(e) => setUrlInputVal(e.target.value)}
                      placeholder="https://... URL รูปภาพ"
                      className="flex-1 bg-slate-900 border border-slate-700 px-2 py-1 rounded text-xs text-white"
                    />
                    <button
                      type="button"
                      onClick={handleApplyUrl}
                      className="bg-emerald-600 hover:bg-emerald-500 text-black font-bold px-2 py-1 rounded text-xs"
                    >
                      ตกลง
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Count & Action Type Box */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-2.5">
            <div>
              <label className="block text-emerald-400 font-bold mb-1 text-center">
                🔢 จำนวนที่ตรวจนับได้ปัจจุบัน:
              </label>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0"
                value={qty}
                onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-900 border-2 border-amber-400 text-amber-300 font-bold text-2xl text-center py-2 rounded-lg focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ประเภทรายการ:</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
                >
                  <option value="ตรวจนับ">📋 ตรวจนับปกติ</option>
                  <option value="เบิกใช้">🔻 เบิกใช้ (ยอดลด)</option>
                  <option value="เติมของ">🔺 เติมสต็อก (ยอดเพิ่ม)</option>
                  <option value="ปรับปรุงยอด">⚙️ ปรับปรุงยอดคงคลัง</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">หมายเหตุ / ผู้เบิก:</label>
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="เช่น เวรเช้า / รหัสผู้เบิก"
                  className="w-full bg-slate-900 border border-slate-700 text-white px-2.5 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Expiry Date & Lot */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">📅 วันหมดอายุ (EXP):</label>
              <input
                type="date"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">🏷️ เลขล็อต (Lot No.):</label>
              <input
                type="text"
                value={lot}
                onChange={(e) => setLot(e.target.value)}
                placeholder="เช่น L1234"
                className="w-full bg-slate-950 border border-slate-700 text-white px-2.5 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* MIN / MAX with toggle */}
          <div>
            <label className="flex items-center gap-2 text-amber-400 font-semibold mb-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={allowEditMinMax}
                onChange={(e) => setAllowEditMinMax(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-0"
              />
              <span>อนุญาตให้แก้ไข MIN / MAX</span>
            </label>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-slate-400 mb-1">ขั้นต่ำ (MIN):</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={min}
                  onChange={(e) => setMin(parseFloat(e.target.value) || 0)}
                  disabled={!allowEditMinMax}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1.5 rounded-md disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">สูงสุด (MAX):</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={max}
                  onChange={(e) => setMax(parseFloat(e.target.value) || 0)}
                  disabled={!allowEditMinMax}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1.5 rounded-md disabled:opacity-50"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">หน่วยนับ (Unit):</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white px-2 py-1.5 rounded-md"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
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
            onClick={handleSave}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs"
          >
            ✓ บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
};
