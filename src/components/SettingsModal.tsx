import React, { useState } from 'react';
import { Settings, Plus, Trash2 } from 'lucide-react';
import { PrintSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PrintSettings;
  onSaveSettings: (newSettings: PrintSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [cardTheme, setCardTheme] = useState(settings.cardTheme);
  const [paperSize, setPaperSize] = useState(settings.paperSize);
  const [fontFamily, setFontFamily] = useState(settings.fontFamily);
  const [margin, setMargin] = useState(settings.margin);
  const [responsiblePerson, setResponsiblePerson] = useState(settings.responsiblePerson);
  const [showFooter, setShowFooter] = useState(settings.showFooter);
  const [rules, setRules] = useState<string[]>([...settings.rules]);

  if (!isOpen) return null;

  const handleAddRule = () => {
    setRules([...rules, '']);
  };

  const handleUpdateRule = (index: number, val: string) => {
    const updated = [...rules];
    updated[index] = val;
    setRules(updated);
  };

  const handleDeleteRule = (index: number) => {
    setRules(rules.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      cardTheme,
      paperSize,
      fontFamily,
      margin: Number(margin) || 10,
      responsiblePerson: responsiblePerson.trim(),
      showFooter,
      rules: rules.filter((r) => r.trim() !== ''),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-amber-400">
              ตั้งค่าการพิมพ์, ธีมสี & ระบบ
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Card Theme */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">
              🎨 โทนสีการ์ดสิ่งของ (Card Theme):
            </label>
            <select
              value={cardTheme}
              onChange={(e) => setCardTheme(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
            >
              <option value="gold">🟡 Gold Yellow (สีเหลืองทองมาตรฐาน)</option>
              <option value="cyber-blue">🔷 Cyber Neon Blue (สีฟ้านีออน)</option>
              <option value="deep-purple">🟣 Deep Violet Purple (สีม่วงเข้ม)</option>
              <option value="emerald-green">🟢 Emerald Green (สีเขียวมรกต)</option>
              <option value="dark-grey">⬛ Dark Modern Grey (สีเทาดำโมเดิร์น)</option>
            </select>
          </div>

          {/* Paper Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">📄 ขนาดกระดาษพิมพ์:</label>
              <select
                value={paperSize}
                onChange={(e) => setPaperSize(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
              >
                <option value="a4-portrait">📄 A4 แนวตั้ง</option>
                <option value="a4-landscape">📄 A4 แนวนอน</option>
                <option value="a5-portrait">📜 A5 แนวตั้ง</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">📐 ขอบกระดาษ Margin (mm):</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(parseFloat(e.target.value) || 10)}
                className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Font Family */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">🔤 แบบอักษร (Font Family):</label>
            <select
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
            >
              <option value="'Sarabun', sans-serif">Sarabun (ทางการ มาตรฐานโรงพยาบาล)</option>
              <option value="'Kanit', sans-serif">Kanit (โมเดิร์น ชัดเจน)</option>
              <option value="'Chakra Petch', sans-serif">Chakra Petch (เหลี่ยม ทันสมัย)</option>
            </select>
          </div>

          {/* Responsible Person */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">👤 ชื่อผู้รับผิดชอบหลัก:</label>
            <input
              type="text"
              value={responsiblePerson}
              onChange={(e) => setResponsiblePerson(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md focus:border-amber-400 focus:outline-none"
            />
          </div>

          {/* Standard Rules */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-emerald-400">
                📜 กฎมาตรฐาน & แนวทางปฏิบัติในใบพิมพ์:
              </label>
              <button
                type="button"
                onClick={handleAddRule}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                เพิ่มกฎ
              </button>
            </div>

            <div className="space-y-1.5">
              {rules.map((rule, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono w-4 text-right">{idx + 1}.</span>
                  <input
                    type="text"
                    value={rule}
                    onChange={(e) => handleUpdateRule(idx, e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 text-white px-2.5 py-1 rounded-md text-xs focus:border-amber-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteRule(idx)}
                    className="p-1 text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Show Footer */}
          <label className="flex items-center gap-2 pt-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={showFooter}
              onChange={(e) => setShowFooter(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 focus:ring-0"
            />
            <span>☑️ แสดงส่วนท้ายกระดาษ (กฎมาตรฐานและช่องลงนามผู้รับผิดชอบ)</span>
          </label>
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
            onClick={handleSave}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs transition-colors"
          >
            ✓ บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
