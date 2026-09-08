import React, { useState } from 'react';
import { Printer } from 'lucide-react';
import { Cabinet, PrintSettings } from '../types';

interface PrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  wardName: string;
  cabinets: Cabinet[];
  printSettings: PrintSettings;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  onClose,
  wardName,
  cabinets,
  printSettings,
}) => {
  // Generate list of all shelves in cabinets
  const allShelfPages = cabinets.flatMap((cab, cabIdx) =>
    cab.shelves.map((shelf, shelfIdx) => ({
      pageKey: `${cabIdx}_${shelfIdx}`,
      title: `${cab.name} ➔ ${shelf.name}`,
      cabinet: cab,
      shelf: shelf,
    }))
  );

  const [selectedPages, setSelectedPages] = useState<string[]>(
    allShelfPages.map((p) => p.pageKey)
  );

  if (!isOpen) return null;

  const handleSelectAll = () => {
    setSelectedPages(allShelfPages.map((p) => p.pageKey));
  };

  const handleDeselectAll = () => {
    setSelectedPages([]);
  };

  const handleTogglePage = (key: string) => {
    setSelectedPages((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleExecutePrint = () => {
    if (selectedPages.length === 0) {
      alert('กรุณาเลือกอย่างน้อย 1 หน้าเพื่อพิมพ์');
      return;
    }

    const printArea = document.getElementById('printableContent');
    if (!printArea) return;

    window.print();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-bold text-blue-400">เลือกหน้าพิมพ์ใบชั้นวาง</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-white p-1">
            ✕
          </button>
        </div>

        {/* Selection Tools */}
        <div className="px-5 py-2.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="space-x-2">
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sky-400 hover:underline font-semibold"
            >
              เลือกทั้งหมด
            </button>
            <span className="text-slate-600">|</span>
            <button
              type="button"
              onClick={handleDeselectAll}
              className="text-slate-400 hover:underline"
            >
              ยกเลิกทั้งหมด
            </button>
          </div>
          <span className="text-slate-400">
            เลือกแล้ว {selectedPages.length} จาก {allShelfPages.length} หน้า
          </span>
        </div>

        {/* Shelf List */}
        <div className="p-5 overflow-y-auto space-y-2 text-xs">
          {allShelfPages.map((page, idx) => (
            <label
              key={page.pageKey}
              className="flex items-center gap-2.5 p-2.5 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={selectedPages.includes(page.pageKey)}
                onChange={() => handleTogglePage(page.pageKey)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-0"
              />
              <span className="font-semibold text-slate-200">
                📄 หน้า {idx + 1}: {page.title}
              </span>
              <span className="text-slate-500 text-[11px] ml-auto">
                ({page.shelf.items.length} รายการ)
              </span>
            </label>
          ))}
        </div>

        {/* Footer */}
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
            onClick={handleExecutePrint}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-lg text-xs shadow-md inline-flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            ยืนยันพิมพ์ ({selectedPages.length} หน้า)
          </button>
        </div>
      </div>

      {/* Hidden container formatted for CSS Print (@media print) */}
      <div id="printableContent" className="hidden print:block text-black bg-white">
        {allShelfPages.map((page, pIdx) => {
          if (!selectedPages.includes(page.pageKey)) return null;

          return (
            <div
              key={page.pageKey}
              className="print-page p-6 border-2 border-black my-4 mx-auto w-full break-after-page"
            >
              <table className="w-full border-collapse border border-black text-xs font-sans">
                <thead>
                  <tr>
                    <th
                      colSpan={7}
                      className="border border-black p-2 text-center text-xl font-bold"
                    >
                      โรงพยาบาลราชพิพัฒน์ สำนักการแพทย์ กรุงเทพมหานคร
                    </th>
                  </tr>
                  <tr>
                    <th colSpan={7} className="border border-black p-1.5 text-center text-base">
                      {wardName}
                    </th>
                  </tr>
                  <tr className="bg-slate-100 font-bold">
                    <td colSpan={3} className="border border-black p-1.5 text-sm">
                      {page.title} (หน้าที่ {pIdx + 1})
                    </td>
                    <td className="border border-black p-1.5 text-center w-16">MIN</td>
                    <td className="border border-black p-1.5 text-center w-16">MAX</td>
                    <td className="border border-black p-1.5 text-center w-20">หน่วย</td>
                    <td className="border border-black p-1.5 text-center w-28">วันหมดอายุ</td>
                  </tr>
                </thead>
                <tbody>
                  {page.shelf.items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="border border-black p-4 text-center">
                        ไม่มีรายการในชั้นนี้
                      </td>
                    </tr>
                  ) : (
                    page.shelf.items.map((it, itemIdx) => (
                      <tr key={it.uid}>
                        <td className="border border-black p-1.5 text-center w-10">
                          {itemIdx + 1}
                        </td>
                        <td className="border border-black p-1.5 font-bold font-mono w-32">
                          {it.code}
                        </td>
                        <td className="border border-black p-1.5">{it.name}</td>
                        <td className="border border-black p-1.5 text-center font-mono">{it.min}</td>
                        <td className="border border-black p-1.5 text-center font-mono">{it.max}</td>
                        <td className="border border-black p-1.5 text-center">{it.unit}</td>
                        <td className="border border-black p-1.5 text-center font-mono">
                          {it.exp || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>

              {/* Standard Hospital Shelf Rules & Signatures */}
              {printSettings.showFooter && (
                <div className="mt-4 pt-3 border-t-2 border-black text-xs">
                  <div className="font-bold mb-1">📜 กฎมาตรฐาน & แนวทางปฏิบัติ:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-2 mb-6">
                    {printSettings.rules.map((rule, rIdx) => (
                      <li key={rIdx}>{rule}</li>
                    ))}
                  </ul>

                  <div className="flex justify-between items-end mt-8 text-xs pt-4">
                    <div className="text-center w-56">
                      <div className="border-b border-dotted border-black mb-1.5"></div>
                      <div>( {printSettings.responsiblePerson || '...........................................'} )</div>
                      <div className="text-[10px] text-gray-600">ผู้รับผิดชอบประจำตู้/หอผู้ป่วย</div>
                    </div>

                    <div className="text-center w-56">
                      <div className="border-b border-dotted border-black mb-1.5"></div>
                      <div>( ..................................................... )</div>
                      <div className="text-[10px] text-gray-600">ผู้ตรวจนับประจำเวร / วันที่ ...../...../.....</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
