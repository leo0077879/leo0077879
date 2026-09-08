import React, { useState, useRef, useEffect } from 'react';
import { Camera, Search } from 'lucide-react';
import { playBeep, triggerHaptic } from '../utils/helpers';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onDetected,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [manualCode, setManualCode] = useState<string>('');
  const [statusMsg, setStatusMsg] = useState<string>('กำลังเปิดกล้อง...');
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      return;
    }

    // List cameras
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevs = devices.filter((d) => d.kind === 'videoinput');
          setCameras(videoDevs);
          if (videoDevs.length > 0) {
            // Default to rear camera if available
            const backCam = videoDevs.find(
              (d) => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear')
            );
            const defaultId = backCam ? backCam.deviceId : videoDevs[videoDevs.length - 1].deviceId;
            setSelectedCameraId(defaultId);
            startCamera(defaultId);
          } else {
            setStatusMsg('ไม่พบอุปกรณ์กล้องบนเครื่องนี้ (สามารถพิมพ์รหัสเพื่อค้นหาแทนได้)');
          }
        })
        .catch(() => {
          setStatusMsg('ไม่สามารถเข้าถึงกล้องได้ (โปรดตรวจสอบสิทธิ์กล้อง)');
        });
    } else {
      setStatusMsg('เบราว์เซอร์ไม่รองรับ Camera API');
    }

    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const startCamera = async (deviceId?: string) => {
    stopCamera();
    try {
      setStatusMsg('กำลังเริ่มสตรีมกล้อง...');
      const constraints: MediaStreamConstraints = {
        video: deviceId
          ? { deviceId: { exact: deviceId } }
          : { facingMode: { ideal: 'environment' } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStatusMsg('นำกล้องส่องไปที่บาร์โค้ด หรือ QR Code ของเวชภัณฑ์');
        startBarcodeDetection();
      }
    } catch (err: any) {
      setStatusMsg(`เปิดกล้องไม่สำเร็จ: ${err.message || err}`);
    }
  };

  const stopCamera = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const startBarcodeDetection = () => {
    // If native BarcodeDetector is supported
    if ('BarcodeDetector' in window) {
      try {
        const barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a', 'upc_e'],
        });

        intervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detectedVal = barcodes[0].rawValue;
                if (detectedVal) {
                  handleSuccessDetection(detectedVal);
                }
              }
            } catch {
              // frame detection error ignore
            }
          }
        }, 300);
      } catch {
        // Barcode detector init error
      }
    }
  };

  const handleSuccessDetection = (code: string) => {
    playBeep();
    triggerHaptic();
    stopCamera();
    onDetected(code.trim());
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleSuccessDetection(manualCode.trim());
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-700 flex items-center justify-between bg-slate-800/80">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-teal-400">สแกนบาร์โค้ด / QR Code</h3>
          </div>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        {/* Camera Select */}
        {cameras.length > 1 && (
          <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">กล้อง:</span>
            <select
              value={selectedCameraId}
              onChange={(e) => {
                setSelectedCameraId(e.target.value);
                startCamera(e.target.value);
              }}
              className="flex-1 bg-slate-900 border border-slate-700 text-white px-2 py-1 rounded text-xs"
            >
              {cameras.map((c, i) => (
                <option key={c.deviceId || i} value={c.deviceId}>
                  {c.label || `กล้อง ${i + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Video Viewport with scan target overlay */}
        <div className="relative bg-black min-h-[260px] flex items-center justify-center overflow-hidden">
          <video
            ref={videoRef}
            playsInline
            muted
            className="w-full max-h-[320px] object-cover"
          />

          {/* Scanner targeting box */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-56 h-56 border-2 border-teal-400/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 shadow-[0_0_8px_#ef4444] animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Status indicator */}
        <div className="p-3 bg-slate-950 text-center text-xs text-teal-300 font-medium border-t border-slate-800">
          {statusMsg}
        </div>

        {/* Manual Barcode input fallback */}
        <form onSubmit={handleManualSubmit} className="p-3 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input
            type="text"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            placeholder="หรือพิมพ์รหัสเวชภัณฑ์ที่นี่..."
            className="flex-1 bg-slate-950 border border-slate-700 text-white px-3 py-1.5 rounded-md text-xs focus:border-teal-400 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold px-3 py-1.5 rounded-md text-xs inline-flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            ค้นหา
          </button>
        </form>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-800/80 border-t border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-1.5 rounded-lg text-xs"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
