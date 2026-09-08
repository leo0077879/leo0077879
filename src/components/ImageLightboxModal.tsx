import React from 'react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  imgSrc: string;
  name: string;
  code: string;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  onClose,
  imgSrc,
  name,
  code,
}) => {
  if (!isOpen || !imgSrc) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 border border-blue-500/50 rounded-xl max-w-md w-full p-4 shadow-2xl"
      >
        <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-700">
          <div className="overflow-hidden pr-2">
            <h4 className="text-sm font-bold text-sky-400 truncate">{name || 'รูปภาพสิ่งของ'}</h4>
            <p className="text-xs text-slate-400">รหัส: {code || '-'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[65vh] min-h-[180px] bg-black rounded-lg flex items-center justify-center overflow-hidden border border-slate-800">
          <img
            src={imgSrc}
            alt={name}
            className="max-w-full max-h-[60vh] object-contain"
          />
        </div>

        <div className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-1.5 rounded-lg text-xs font-semibold"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
