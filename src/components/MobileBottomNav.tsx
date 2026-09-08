import React, { useState } from 'react';
import {
  Layers,
  Package,
  Camera,
  BarChart2,
  Menu,
  Apple,
  FileSpreadsheet,
  Download,
  Printer,
  ClipboardList,
  Settings,
  Cloud,
  FileText,
  Upload,
} from 'lucide-react';

interface MobileBottomNavProps {
  currentTab: 'cabinets' | 'unassigned' | 'analytics' | 'audit';
  onSelectTab: (tab: 'cabinets' | 'unassigned' | 'analytics' | 'audit') => void;
  onOpenScan: () => void;
  onOpenAppleScript: () => void;
  onOpenImportExcel: () => void;
  onExportAllExcel: () => void;
  onOpenPrint: () => void;
  onOpenSettings: () => void;
  onOpenCloud: () => void;
  onSaveTxtNotePad: () => void;
  onOpenSearch: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenScan,
  onOpenAppleScript,
  onOpenImportExcel,
  onExportAllExcel,
  onOpenPrint,
  onOpenSettings,
  onOpenCloud,
  onSaveTxtNotePad,
  onOpenSearch,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {/* Fixed bottom navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 md:hidden flex items-center justify-around px-2 py-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={() => onSelectTab('cabinets')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-md ${
            currentTab === 'cabinets' ? 'text-amber-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>ในคลัง</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('unassigned')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-md ${
            currentTab === 'unassigned' ? 'text-purple-400 font-bold' : 'text-slate-400'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>นอกคลัง</span>
        </button>

        {/* Central Camera Scan Button */}
        <button
          type="button"
          onClick={onOpenScan}
          className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-slate-950 active:scale-95 transition-transform"
          title="สแกนบาร์โค้ด"
        >
          <Camera className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('analytics')}
          className={`flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-md ${
            currentTab === 'analytics' ? 'text-cyan-400 font-bold' : 'text-slate-400'
          }`}
        >
          <BarChart2 className="w-4 h-4" />
          <span>สถิติ</span>
        </button>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-semibold py-1 px-2 rounded-md text-slate-400 hover:text-white"
        >
          <Menu className="w-4 h-4" />
          <span>เมนู</span>
        </button>
      </nav>

      {/* Mobile Drawer Modal */}
      {isDrawerOpen && (
        <div
          onClick={() => setIsDrawerOpen(false)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-xs md:hidden"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-2xl sm:rounded-xl w-full max-w-sm p-4 space-y-3 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-amber-400">📱 เมนูคำสั่งระบบ</h4>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="text-slate-400 text-sm p-1"
              >
                ✕
              </button>
            </div>

            {/* AppleScript button prominent */}
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                onOpenAppleScript();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-rose-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs"
            >
              <span className="flex items-center gap-2">
                <Apple className="w-4 h-4 text-amber-400" />
                คำสั่ง AppleScript เปิดเว็บ
              </span>
              <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-bold">
                macOS
              </span>
            </button>

            {/* Grid of drawer actions */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenSearch();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <span>🔍</span>
                <span>ค้นหาของ</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onSelectTab('audit');
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <ClipboardList className="w-4 h-4 text-amber-400" />
                <span>ประวัติเบิกจ่าย</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenImportExcel();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <FileSpreadsheet className="w-4 h-4 text-orange-400" />
                <span>นำเข้า Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onExportAllExcel();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>ส่งออก Excel</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenPrint();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>พิมพ์ใบชั้นวาง</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenSettings();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>ตั้งค่าพิมพ์ & ธีม</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onOpenCloud();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <Cloud className="w-4 h-4 text-indigo-400" />
                <span>Cloud / Sheets</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsDrawerOpen(false);
                  onSaveTxtNotePad();
                }}
                className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col items-center gap-1 text-slate-200 font-semibold active:bg-slate-800"
              >
                <FileText className="w-4 h-4 text-purple-400" />
                <span>บันทึก NotePad</span>
              </button>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg text-xs"
              >
                ปิดเมนู
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
