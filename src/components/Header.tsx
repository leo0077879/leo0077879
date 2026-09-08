import React, { useRef } from 'react';
import {
  Camera,
  Search,
  Undo2,
  Redo2,
  FileText,
  Upload,
  Download,
  Printer,
  BarChart3,
  Settings,
  Cloud,
  FileSpreadsheet,
  Plus,
  Trash2,
  Apple,
} from 'lucide-react';
import { CloudSettings } from '../types';

interface HeaderProps {
  currentTab: 'cabinets' | 'unassigned' | 'analytics' | 'audit';
  onSelectTab: (tab: 'cabinets' | 'unassigned' | 'analytics' | 'audit') => void;
  wards: string[];
  currentWard: string;
  onSelectWard: (ward: string) => void;
  onAddWard: () => void;
  onDeleteWard: () => void;
  isCountMode: boolean;
  onToggleCountMode: () => void;
  onResetCountStatus: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  saveTarget: 'local' | 'cloud';
  onSelectSaveTarget: (target: 'local' | 'cloud') => void;
  saveStatusMsg: string;
  cloudSettings: CloudSettings;
  onOpenScan: () => void;
  onOpenSearch: () => void;
  onOpenAppleScript: () => void;
  onOpenImportExcel: () => void;
  onExportAllExcel: () => void;
  onOpenPrint: () => void;
  onOpenSettings: () => void;
  onOpenCloud: () => void;
  onSaveTxtNotePad: () => void;
  onLoadTxtNotePad: (file: File) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  wards,
  currentWard,
  onSelectWard,
  onAddWard,
  onDeleteWard,
  isCountMode,
  onToggleCountMode,
  onResetCountStatus,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  saveTarget,
  onSelectSaveTarget,
  saveStatusMsg,
  cloudSettings,
  onOpenScan,
  onOpenSearch,
  onOpenAppleScript,
  onOpenImportExcel,
  onExportAllExcel,
  onOpenPrint,
  onOpenSettings,
  onOpenCloud,
  onSaveTxtNotePad,
  onLoadTxtNotePad,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onLoadTxtNotePad(file);
      e.target.value = '';
    }
  };

  return (
    <header className="space-y-3">
      {/* Top Banner & Title */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🏥</span>
          <div>
            <h1 className="text-lg font-bold text-amber-400 tracking-tight">
              ระบบบันทึกตู้และชั้นวางของ
            </h1>
            <p className="text-xs text-slate-400">
              โรงพยาบาลราชพิพัฒน์ สำนักการแพทย์ กรุงเทพมหานคร
            </p>
          </div>
        </div>

        {/* Action button & Navigation tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* AppleScript button prominent */}
          <button
            type="button"
            onClick={onOpenAppleScript}
            className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition-all active:scale-95"
            title="คำสั่ง AppleScript สำหรับเปิดเว็บนี้ในเบราว์เซอร์อัตโนมัติ"
          >
            <Apple className="w-3.5 h-3.5 fill-current" />
            คำสั่ง AppleScript เปิดเว็บ
          </button>

          <button
            type="button"
            onClick={onOpenScan}
            className="inline-flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-sm transition-colors"
          >
            <Camera className="w-3.5 h-3.5" />
            สแกนบาร์โค้ด
          </button>

          {/* Main Navigation Tabs */}
          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => onSelectTab('cabinets')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                currentTab === 'cabinets'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              🏢 ในคลัง
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('unassigned')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                currentTab === 'unassigned'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📦 ของนอกคลัง
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('analytics')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                currentTab === 'analytics'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📈 สถิติ & เบิก
            </button>
            <button
              type="button"
              onClick={() => onSelectTab('audit')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
                currentTab === 'audit'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              📋 ประวัติ
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar (Desktop) */}
      <div className="hidden md:flex flex-col gap-2 bg-slate-900/90 p-3 rounded-xl border border-slate-800 text-xs">
        {/* Top line: Save status & sync */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-amber-400">💾 บันทึก:</span>
            <select
              value={saveTarget}
              onChange={(e) => onSelectSaveTarget(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-white px-2.5 py-1 rounded-md text-xs"
            >
              <option value="local">เบราว์เซอร์ในเครื่อง (LocalStorage)</option>
              <option value="cloud">ระบบคลาวด์ (Google Sheets / API)</option>
            </select>
            {saveTarget === 'cloud' && (
              <button
                type="button"
                onClick={onOpenCloud}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded text-xs font-bold"
              >
                🔄 ซิงค์ Sheets
              </button>
            )}
          </div>

          <span className="bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-semibold text-[11px]">
            {saveStatusMsg}
          </span>
        </div>

        {/* Action Row 1 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <button
            type="button"
            onClick={onToggleCountMode}
            className={`inline-flex items-center gap-1 font-bold px-2.5 py-1.5 rounded-md transition-all ${
              isCountMode
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-[0_0_12px_rgba(236,72,153,0.5)]'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            📊 โหมดนับสต็อก: {isCountMode ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={onResetCountStatus}
            className="bg-amber-600/80 hover:bg-amber-600 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors"
          >
            ⬅️ รีเซ็ตการนับ
          </button>

          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-slate-200 px-2.5 py-1.5 rounded-md font-semibold transition-colors"
            title="ย้อนกลับ (Ctrl+Z)"
          >
            <Undo2 className="w-3.5 h-3.5" />
            ย้อนกลับ
          </button>

          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 disabled:opacity-35 text-slate-200 px-2.5 py-1.5 rounded-md font-semibold transition-colors"
            title="ถัดไป (Ctrl+Y)"
          >
            <Redo2 className="w-3.5 h-3.5" />
            ถัดไป
          </button>

          <button
            type="button"
            onClick={onSaveTxtNotePad}
            className="inline-flex items-center gap-1 bg-purple-700 hover:bg-purple-600 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors"
          >
            <FileText className="w-3.5 h-3.5" />
            บันทึก NotePad
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1 bg-fuchsia-700 hover:bg-fuchsia-600 text-white px-2.5 py-1.5 rounded-md font-semibold transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            โหลด NotePad
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.json"
            className="hidden"
          />

          <button
            type="button"
            onClick={onOpenSearch}
            className="inline-flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-slate-950 px-2.5 py-1.5 rounded-md font-bold transition-colors ml-auto"
          >
            <Search className="w-3.5 h-3.5" />
            ค้นหาของ
          </button>
        </div>

        {/* Action Row 2 */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onOpenImportExcel}
            className="inline-flex items-center gap-1 bg-orange-600 hover:bg-orange-500 text-white font-bold px-2.5 py-1.5 rounded-md transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            นำเข้า Excel
          </button>

          <button
            type="button"
            onClick={onExportAllExcel}
            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            ส่งออก Excel
          </button>

          <button
            type="button"
            onClick={onOpenPrint}
            className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-500 text-white font-bold px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            พิมพ์ใบชั้นวาง
          </button>

          <button
            type="button"
            onClick={() => onSelectTab('analytics')}
            className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold px-2.5 py-1.5 rounded-md transition-colors"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            สถิติการเบิก
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-2.5 py-1.5 rounded-md transition-colors ml-auto"
          >
            <Settings className="w-3.5 h-3.5" />
            ตั้งค่าการพิมพ์ & ธีม
          </button>

          <button
            type="button"
            onClick={onOpenCloud}
            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-2.5 py-1.5 rounded-md transition-colors"
          >
            <Cloud className="w-3.5 h-3.5" />
            Cloud / Sheets
          </button>
        </div>
      </div>

      {/* Ward Selector Bar */}
      <div className="flex items-center gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex-wrap">
        <label className="text-xs font-bold text-slate-300">🏥 หอผู้ป่วย:</label>
        <select
          value={currentWard}
          onChange={(e) => onSelectWard(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-white font-bold text-sm px-3 py-1.5 rounded-lg flex-1 max-w-md focus:border-amber-400 focus:outline-none"
        >
          {wards.map((w) => (
            <option key={w} value={w}>
              {w}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onAddWard}
          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-emerald-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          เพิ่มหอผู้ป่วย
        </button>

        <button
          type="button"
          onClick={onDeleteWard}
          className="inline-flex items-center gap-1 bg-slate-800 hover:bg-red-700 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          ลบ
        </button>
      </div>
    </header>
  );
};
