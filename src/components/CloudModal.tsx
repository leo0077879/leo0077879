import React, { useState } from 'react';
import { Cloud, Check, UploadCloud, DownloadCloud, Copy, HelpCircle, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { CloudSettings } from '../types';

const APPS_SCRIPT_TEMPLATE = `// === Google Apps Script for ระบบบันทึกตู้และชั้นวางของ รพ.ราชพิพัฒน์ ===

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';
  if (action === 'ping') {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'ok', message: 'connected' }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  // ดึงข้อมูลสำหรับปุ่ม "ดึงข้อมูลลงมา"
  var prop = PropertiesService.getScriptProperties();
  var savedJson = prop.getProperty('SHELF_APP_DATA');
  var data = savedJson ? JSON.parse(savedJson) : null;

  return ContentService
    .createTextOutput(JSON.stringify({ status: 'success', data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var rawData = e.postData.contents;
    var parsed = JSON.parse(rawData);

    // 1. บันทึกข้อมูล JSON ลง ScriptProperties เพื่อให้โหลดกลับได้ครบ 100%
    var prop = PropertiesService.getScriptProperties();
    prop.setProperty('SHELF_APP_DATA', rawData);

    // 2. นำข้อมูลลง Google Sheet ให้เป็นตารางอ่านง่าย
    syncToSheet(parsed);

    return ContentService
      .createTextOutput(JSON.stringify({ status: 'success' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function syncToSheet(payload) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('รายการสต็อก');
  if (!sheet) {
    sheet = ss.insertSheet('รายการสต็อก');
  }
  sheet.clearContents();

  var headers = ['ลำดับ', 'หอผู้ป่วย', 'ตู้', 'ชั้นวาง', 'รหัสสิ่งของ', 'ชื่อสิ่งของ', 'คงเหลือ', 'หน่วย', 'MIN', 'MAX', 'วันหมดอายุ', 'Lot No', 'ตรวจนับแล้ว', 'อัปเดตล่าสุด'];
  var rows = [headers];
  var count = 1;

  var allWardsData = payload.allWardsData || {};
  for (var wardName in allWardsData) {
    var ward = allWardsData[wardName];
    if (ward && ward.cabinets) {
      ward.cabinets.forEach(function(cab) {
        cab.shelves.forEach(function(shelf) {
          shelf.items.forEach(function(it) {
            rows.push([
              count++,
              wardName,
              cab.name || '',
              shelf.name || '',
              it.code || '',
              it.name || '',
              it.qty || 0,
              it.unit || 'ชิ้น',
              it.min || 0,
              it.max || 0,
              it.exp || '-',
              it.lot || '-',
              it.isCounted ? 'นับแล้ว' : 'รอนับ',
              it.lastUpdated || '-'
            ]);
          });
        });
      });
    }
  }

  if (rows.length > 0) {
    sheet.getRange(1, 1, rows.length, headers.length).setValues(rows);
    sheet.getRange(1, 1, 1, headers.length).setBackground('#1e293b').setFontColor('#ffffff').setFontWeight('bold');
    sheet.autoResizeColumns(1, headers.length);
  }
}`;

interface CloudModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CloudSettings;
  onSaveSettings: (newSettings: CloudSettings) => void;
  onPushToCloud: () => void;
  onPullFromCloud: () => void;
}

export const CloudModal: React.FC<CloudModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onPushToCloud,
  onPullFromCloud,
}) => {
  const [gasUrl, setGasUrl] = useState(settings.gasUrl || '');
  const [autoSync, setAutoSync] = useState(settings.autoSync || false);
  const [testStatus, setTestStatus] = useState<string>('');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [showInstructions, setShowInstructions] = useState<boolean>(!settings.gasUrl);
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_TEMPLATE);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!gasUrl.trim()) {
      alert('กรุณาระบุ Web App URL ก่อนทดสอบ');
      return;
    }
    if (!gasUrl.trim().endsWith('/exec')) {
      setTestStatus('⚠️ คำเตือน: URL ควรลงท้ายด้วย /exec (ห้ามใช้ /edit หรือ /dev)');
    }
    setIsTesting(true);
    setTestStatus('⏳ กำลังทดสอบเชื่อมต่อ...');
    try {
      const res = await fetch(`${gasUrl.trim()}?action=ping`);
      const data = await res.json();
      if (data.status === 'ok') {
        setTestStatus('✅ เชื่อมต่อสำเร็จ! (สถานะระบบพร้อมใช้งาน)');
      } else {
        setTestStatus('✅ ได้รับคำตอบจากเซิร์ฟเวอร์แล้ว');
      }
    } catch {
      setTestStatus('❌ ไม่สามารถเชื่อมต่อได้ (โปรดตรวจสิทธิ์การเข้าถึงเป็น "Anyone" หรือ "ทุกคน" ใน Apps Script)');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSaveSettings({
      gasUrl: gasUrl.trim(),
      autoSync,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/90">
          <div className="flex items-center gap-2">
            <Cloud className="w-5 h-5 text-sky-400" />
            <h3 className="text-base font-bold text-sky-400">
              เชื่อมต่อ Google Sheets (Cloud Sync)
            </h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Guide toggle button */}
          <div className="bg-sky-950/40 border border-sky-800/60 rounded-lg p-3">
            <button
              type="button"
              onClick={() => setShowInstructions(!showInstructions)}
              className="w-full flex items-center justify-between font-bold text-sky-300 text-xs hover:text-sky-200"
            >
              <span className="flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-sky-400" />
                📖 วิธีสร้าง Google Sheets & นำ Web App URL มาใส่ (5 ขั้นตอน)
              </span>
              {showInstructions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showInstructions && (
              <div className="mt-3 pt-3 border-t border-sky-800/40 space-y-2.5 text-slate-300 text-[11px] leading-relaxed">
                <ol className="list-decimal list-inside space-y-1.5 pl-1">
                  <li>
                    เปิดสร้าง Google Sheets ใหม่ที่{' '}
                    <a
                      href="https://sheets.new"
                      target="_blank"
                      rel="noreferrer"
                      className="text-sky-400 underline inline-flex items-center gap-0.5"
                    >
                      sheets.new <ExternalLink className="w-3 h-3" />
                    </a>
                  </li>
                  <li>
                    ไปที่เมนูด้านบนของ Google Sheets: <b>ส่วนขยาย (Extensions)</b> ➔{' '}
                    <b>Apps Script</b>
                  </li>
                  <li>
                    ลบโค้ดเดิมใน Apps Script ทั้งหมด แล้วกดปุ่มคัดลอกโค้ดด้านล่างนี้ไปวางแทน:
                    <div className="mt-1.5 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCopyCode}
                        className="inline-flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1 rounded text-xs transition-colors"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedCode ? '✓ คัดลอกโค้ดแล้ว!' : 'คัดลอกโค้ด Apps Script'}
                      </button>
                    </div>
                  </li>
                  <li>
                    กดปุ่มสีน้ำเงิน <b>ทำให้ใช้งานได้ (Deploy)</b> มุมขวาบน ➔{' '}
                    <b>การทำให้ใช้งานได้รายการใหม่ (New deployment)</b>
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-0.5 text-amber-300">
                      <li>เลือกประเภท: <b>เว็บแอป (Web app)</b></li>
                      <li>เรียกใช้เป็น (Execute as): <b>ตัวฉัน (Me)</b></li>
                      <li>
                        ผู้มีสิทธิ์เข้าถึง (Who has access):{' '}
                        <b className="bg-rose-950 text-rose-300 px-1 py-0.5 rounded border border-rose-700">
                          ทุกคน (Anyone)
                        </b>{' '}
                        *(สำคัญที่สุด หากไม่เลือก ทุกคน จะเชื่อมต่อไม่ได้)*
                      </li>
                    </ul>
                  </li>
                  <li>
                    กด <b>ทำให้ใช้งานได้ (Deploy)</b> ➔ กดยอมรับสิทธิ์ (Allow) ➔ คัดลอก{' '}
                    <b>URL ของเว็บแอป</b> (ที่ลงท้ายด้วย <code className="text-amber-400 font-mono">/exec</code>)
                    มาวางในช่องด้านล่าง แล้วกด <b>"ทดสอบเชื่อมต่อ"</b>
                  </li>
                </ol>
              </div>
            )}
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Google Apps Script Web App URL (ลงท้ายด้วย /exec):
            </label>
            <input
              type="url"
              value={gasUrl}
              onChange={(e) => setGasUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full bg-slate-950 border border-slate-700 text-sky-300 px-3 py-2 rounded-md font-mono text-xs focus:border-sky-400 focus:outline-none placeholder:text-slate-600"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none text-slate-300">
            <input
              type="checkbox"
              checked={autoSync}
              onChange={(e) => setAutoSync(e.target.checked)}
              className="w-4 h-4 rounded text-sky-500 focus:ring-0"
            />
            <span className="font-semibold text-slate-200">
              🔄 เปิดใช้งาน Auto-Sync อัตโนมัติเมื่อมีการเปลี่ยนแปลงสต็อก
            </span>
          </label>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-md transition-colors"
            >
              🔌 ทดสอบเชื่อมต่อ
            </button>

            <button
              type="button"
              onClick={onPushToCloud}
              className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              ส่งข้อมูลขึ้น Sheets
            </button>

            <button
              type="button"
              onClick={onPullFromCloud}
              className="inline-flex items-center gap-1 bg-sky-600 hover:bg-sky-500 text-white font-bold px-3 py-1.5 rounded-md transition-colors shadow-xs"
            >
              <DownloadCloud className="w-3.5 h-3.5" />
              ดึงข้อมูลลงมา
            </button>
          </div>

          {testStatus && (
            <div className={`text-xs p-2.5 rounded-lg border ${
              testStatus.includes('✅')
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-rose-950/60 border-rose-700 text-rose-300'
            }`}>
              {testStatus}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/80 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium px-4 py-2 rounded-lg text-xs"
          >
            ปิด
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold px-5 py-2 rounded-lg text-xs inline-flex items-center gap-1"
          >
            <Check className="w-4 h-4" />
            บันทึกการตั้งค่า
          </button>
        </div>
      </div>
    </div>
  );
};
