import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  Download,
  Terminal,
  Compass,
  Chrome,
  Globe,
  ExternalLink,
  Code,
  HelpCircle,
  Laptop,
} from 'lucide-react';
import {
  getAppleScriptDefaultBrowser,
  getAppleScriptSafari,
  getAppleScriptChrome,
  getTerminalCommand,
  getInteractiveAppleScript,
  downloadTextFile,
} from '../utils/helpers';

interface AppleScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppleScriptModal: React.FC<AppleScriptModalProps> = ({ isOpen, onClose }) => {
  const [targetUrl, setTargetUrl] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'default' | 'safari' | 'chrome' | 'terminal' | 'interactive'>('default');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setTargetUrl(window.location.href);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const currentUrl = targetUrl || (typeof window !== 'undefined' ? window.location.href : 'http://localhost:3000');

  const defaultScript = getAppleScriptDefaultBrowser(currentUrl);
  const safariScript = getAppleScriptSafari(currentUrl);
  const chromeScript = getAppleScriptChrome(currentUrl);
  const terminalCmd = getTerminalCommand(currentUrl);
  const interactiveScript = getInteractiveAppleScript(currentUrl);

  const getActiveCode = () => {
    switch (activeTab) {
      case 'default':
        return defaultScript;
      case 'safari':
        return safariScript;
      case 'chrome':
        return chromeScript;
      case 'terminal':
        return terminalCmd;
      case 'interactive':
        return interactiveScript;
      default:
        return defaultScript;
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleDownload = () => {
    const code = getActiveCode();
    const filename = activeTab === 'terminal' ? 'open_shelf_web.sh' : 'OpenShelfSystem.applescript';
    downloadTextFile(code, filename);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">🍎</span>
            <div>
              <h3 className="text-base font-bold text-amber-400">
                เปิดเว็บผ่าน AppleScript (macOS Browser Launcher)
              </h3>
              <p className="text-xs text-slate-400">
                คำสั่ง AppleScript สำหรับเปิดเบราว์เซอร์และโหลด URL ของระบบโดยอัตโนมัติ
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-sm">
          {/* Target URL field */}
          <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-sky-400" />
              URL ที่ต้องการให้ AppleScript สั่งเปิดเบราว์เซอร์:
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://..."
                className="flex-1 bg-slate-950 border border-slate-700 text-sky-300 px-3 py-1.5 rounded-md text-xs font-mono focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={() => setTargetUrl(window.location.href)}
                className="bg-slate-700 hover:bg-slate-600 text-xs px-2.5 py-1.5 rounded-md text-slate-200 transition-colors"
                title="รีเซ็ตเป็น URL ปัจจุบันของเว็บนี้"
              >
                URL ปัจจุบัน
              </button>
            </div>
          </div>

          {/* Script Type Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              เลือกรูปแบบคำสั่ง AppleScript / Terminal:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 bg-slate-950 p-1.5 rounded-lg border border-slate-800">
              <button
                type="button"
                onClick={() => setActiveTab('default')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === 'default'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                เบราว์เซอร์หลัก
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('safari')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === 'safari'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Safari
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('chrome')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === 'chrome'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Chrome className="w-3.5 h-3.5" />
                Chrome
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('terminal')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === 'terminal'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                Terminal
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('interactive')}
                className={`flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-xs font-medium transition-colors ${
                  activeTab === 'interactive'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                แบบโต้ตอบ
              </button>
            </div>
          </div>

          {/* Code display block */}
          <div className="relative bg-slate-950 border border-slate-800 rounded-lg p-3.5 font-mono text-xs text-amber-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-[11px]">
              <span className="flex items-center gap-1.5 font-sans">
                <Laptop className="w-3.5 h-3.5 text-amber-400" />
                {activeTab === 'terminal' ? 'macOS Bash / Zsh Terminal' : 'AppleScript Code (.applescript)'}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => copyToClipboard(getActiveCode(), 'activeCode')}
                  className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 px-2 py-1 rounded text-xs transition-colors"
                >
                  {copiedKey === 'activeCode' ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400 font-bold">คัดลอกแล้ว!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>คัดลอกคำสั่ง</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 px-2 py-1 rounded text-xs transition-colors"
                  title="ดาวน์โหลดไฟล์สคริปต์"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>ดาวน์โหลด</span>
                </button>
              </div>
            </div>

            <pre className="overflow-x-auto whitespace-pre font-mono leading-relaxed select-all">
              {getActiveCode()}
            </pre>
          </div>

          {/* Instructions */}
          <div className="bg-slate-800/60 border border-slate-700/80 rounded-lg p-3.5 text-xs space-y-2 text-slate-300">
            <h4 className="font-bold text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4" />
              วิธีนำไปใช้งานบน macOS (MacBook / iMac / Mac mini):
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1 leading-relaxed">
              <li>
                <strong className="text-white">เปิดโปรแกรม Script Editor:</strong> กด{' '}
                <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-sky-300">
                  Cmd + Space
                </kbd>{' '}
                พิมพ์คำว่า <span className="text-amber-300 font-mono">Script Editor</span> แล้วกด Enter
              </li>
              <li>
                <strong className="text-white">วางโค้ด:</strong> คัดลอกโค้ด AppleScript ด้านบน แล้วนำไปวางในหน้าต่าง Script Editor
              </li>
              <li>
                <strong className="text-white">ทดสอบรัน:</strong> กดปุ่มรัน{' '}
                <span className="text-emerald-400 font-bold">▶ (Run)</span> หรือกด{' '}
                <kbd className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 text-sky-300">
                  Cmd + R
                </kbd>{' '}
                เบราว์เซอร์จะเปิดและโหลด URL ของระบบตู้และชั้นวางของทันที!
              </li>
              <li>
                <strong className="text-white">สร้างแอปพลิเคชันคลิกเปิดได้ตลอดเวลา:</strong> ใน Script Editor ไปที่เมนู{' '}
                <span className="text-sky-300">File ➔ Export...</span> เลือก{' '}
                <span className="text-amber-300 font-bold">File Format: Application</span> แล้วบันทึกลงโฟลเดอร์ Applications หรือ Desktop จะได้ไอคอนแอปที่ดับเบิลคลิกเปิดได้ทันที
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            โรงพยาบาลราชพิพัฒน์ • ระบบบันทึกตู้และชั้นวางของ
          </span>
          <button
            onClick={onClose}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 rounded-lg text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
