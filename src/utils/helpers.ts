export function getCurrentTimeString(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} น.`;
}

export function getFullDateTimeString(): string {
  const now = new Date();
  const d = String(now.getDate()).padStart(2, '0');
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const y = now.getFullYear() + 543;
  const t = getCurrentTimeString();
  return `${d}/${m}/${y} ${t}`;
}

export function getCurrentDateKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getCurrentMonthKey(): string {
  return new Date().toISOString().slice(0, 7);
}

export function getCurrentYearKey(): string {
  return String(new Date().getFullYear());
}

export function playBeep(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // AudioContext not allowed or not supported
  }
}

export function triggerHaptic(): void {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(30);
    } catch {
      // Vibrate not allowed
    }
  }
}

export interface ExpInfo {
  status: 'none' | 'expired' | 'near-exp' | 'normal';
  label: string;
  days?: number;
}

export function checkExpStatus(expDateStr?: string): ExpInfo {
  if (!expDateStr) return { status: 'none', label: '' };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expDateStr);
  exp.setHours(0, 0, 0, 0);
  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return { status: 'expired', label: '⚠️ หมดอายุ', days: diffDays };
  if (diffDays <= 90) return { status: 'near-exp', label: `⏳ ${diffDays} วัน`, days: diffDays };
  return { status: 'normal', label: `📅 ${expDateStr}`, days: diffDays };
}

export function extractCodeAndNameWithAI(rawCode: string, rawName: string): { code: string; name: string; aiStatus: string; statusClass: string } {
  const code = (rawCode || '').trim();
  const name = (rawName || '').trim();

  const isGenericThaiCat = /^(เวชภัณฑ์|วิทยาศาสตร์|ยา|วัสดุ|ครุภัณฑ์|อุปกรณ์)/.test(code);
  const nameMatch = name.match(/^([A-Za-z0-9\-_]{3,15})\s+(.+)$/);

  if (nameMatch) {
    return {
      code: nameMatch[1],
      name: nameMatch[2],
      aiStatus: '✨ AI แยกสำเร็จ',
      statusClass: 'bg-emerald-600 text-white',
    };
  }

  if (code && !isGenericThaiCat && !/[\u0E00-\u0E7F]/.test(code)) {
    return {
      code: code,
      name: name,
      aiStatus: '✅ รหัสเดิมถูกต้อง',
      statusClass: 'bg-blue-600 text-white',
    };
  }

  return {
    code: code || 'N/A',
    name: name,
    aiStatus: '⚠️ รหัสทั่วไป',
    statusClass: 'bg-amber-500 text-black',
  };
}

export function compressImageFile(file: File, callback: (base64: string) => void): void {
  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 420;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = maxDim;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        callback(compressed);
      }
    };
    img.onerror = () => alert('ไม่สามารถเปิดไฟล์รูปภาพนี้ได้');
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export function downloadTextFile(content: string, fileName: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * AppleScript generator helpers
 */
export function getAppleScriptDefaultBrowser(targetUrl: string): string {
  return `open location "${targetUrl}"`;
}

export function getAppleScriptSafari(targetUrl: string): string {
  return `tell application "Safari"
    activate
    open location "${targetUrl}"
end tell`;
}

export function getAppleScriptChrome(targetUrl: string): string {
  return `tell application "Google Chrome"
    activate
    open location "${targetUrl}"
end tell`;
}

export function getTerminalCommand(targetUrl: string): string {
  return `osascript -e 'open location "${targetUrl}"'`;
}

export function getInteractiveAppleScript(targetUrl: string): string {
  return `(*
  สคริปต์ AppleScript สำหรับเปิดระบบบันทึกตู้และชั้นวางของ รพ.ราชพิพัฒน์
  สามารถรันในโปรแกรม Script Editor บน macOS ได้ทันที
*)

set targetUrl to "${targetUrl}"

set theDialog to display dialog "เลือกวิธีการเปิดเว็บระบบตู้และชั้นวางของ:" & return & return & "URL: " & targetUrl buttons {"ยกเลิก", "เปิดใน Safari", "เปิดเบราว์เซอร์เริ่มต้น"} default button "เปิดเบราว์เซอร์เริ่มต้น" with title "โรงพยาบาลราชพิพัฒน์ - ระบบตู้และชั้นวาง" with icon note

set chosenBtn to button returned of theDialog

if chosenBtn is "เปิดเบราว์เซอร์เริ่มต้น" then
    open location targetUrl
else if chosenBtn is "เปิดใน Safari" then
    tell application "Safari"
        activate
        open location targetUrl
    end tell
end if
`;
}
