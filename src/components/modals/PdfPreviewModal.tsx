import React, { useState, useRef, useCallback } from 'react';
import { X, Check, MousePointer2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PdfPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  title: string;
  mode?: 'view' | 'sign';
  signatureUrl?: string | null;
  onApprove?: (position: { x: number; y: number; page: number; scale: number }) => void;
}

const MIN_SCALE = 0.5;
const MAX_SCALE = 2.0;
const SCALE_STEP = 0.1;
const DEFAULT_SCALE = 1.0;

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ 
  isOpen, 
  onClose, 
  fileUrl, 
  title,
  mode = 'view',
  signatureUrl,
  onApprove
}) => {
  const [position, setPosition] = useState({ x: 400, y: 300 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [scale, setScale] = useState(DEFAULT_SCALE);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    // Ignore if clicking on resize controls
    if ((e.target as HTMLElement).closest('[data-resize-control]')) return;
    
    e.preventDefault();
    e.stopPropagation();
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    
    const rect = target.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !previewAreaRef.current) return;
    e.preventDefault();
    
    const containerRect = previewAreaRef.current.getBoundingClientRect();
    const sigEl = signatureRef.current;
    const sigWidth = sigEl?.offsetWidth ?? 120;
    const sigHeight = sigEl?.offsetHeight ?? 80;

    let newX = e.clientX - containerRect.left - dragOffset.x;
    let newY = e.clientY - containerRect.top - dragOffset.y;

    // Clamp within bounds
    newX = Math.max(0, Math.min(newX, containerRect.width - sigWidth));
    newY = Math.max(0, Math.min(newY, containerRect.height - sigHeight));

    setPosition({ x: newX, y: newY });
  }, [isDragging, dragOffset]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleScaleUp = useCallback(() => {
    setScale(prev => Math.min(prev + SCALE_STEP, MAX_SCALE));
  }, []);

  const handleScaleDown = useCallback(() => {
    setScale(prev => Math.max(prev - SCALE_STEP, MIN_SCALE));
  }, []);

  const handleScaleReset = useCallback(() => {
    setScale(DEFAULT_SCALE);
  }, []);

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setScale(parseFloat(e.target.value));
  }, []);

  const handleApprove = () => {
    if (onApprove && previewAreaRef.current) {
      const container = previewAreaRef.current;
      const rect = container.getBoundingClientRect();
      
      const relativeX = position.x / rect.width;
      const relativeY = position.y / rect.height;
      
      onApprove({ x: relativeX, y: relativeY, page: 1, scale });
    }
  };

  const scalePercent = Math.round(scale * 100);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                {mode === 'sign' && signatureUrl && (
                  <p className="text-sm text-blue-600 font-medium flex items-center gap-1 mt-1">
                    <MousePointer2 className="w-4 h-4" /> Geser tanda tangan ke posisi yang diinginkan
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            {/* Resize Toolbar - only in sign mode */}
            {mode === 'sign' && signatureUrl && (
              <div className="px-8 py-3 border-b bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-center gap-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mr-1">Ukuran</span>
                
                <button
                  onClick={handleScaleDown}
                  disabled={scale <= MIN_SCALE}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Perkecil"
                  data-resize-control
                >
                  <ZoomOut className="w-4 h-4 text-gray-600" />
                </button>

                <div className="flex items-center gap-2.5 min-w-[180px]">
                  <input
                    type="range"
                    min={MIN_SCALE}
                    max={MAX_SCALE}
                    step={SCALE_STEP}
                    value={scale}
                    onChange={handleSliderChange}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer accent-blue-600 bg-gray-200"
                    data-resize-control
                  />
                  <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full min-w-[42px] text-center tabular-nums">
                    {scalePercent}%
                  </span>
                </div>

                <button
                  onClick={handleScaleUp}
                  disabled={scale >= MAX_SCALE}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95"
                  title="Perbesar"
                  data-resize-control
                >
                  <ZoomIn className="w-4 h-4 text-gray-600" />
                </button>

                <button
                  onClick={handleScaleReset}
                  className="p-1.5 rounded-lg bg-white border border-gray-200 shadow-sm hover:bg-gray-50 transition-all active:scale-95 ml-1"
                  title="Reset ukuran"
                  data-resize-control
                >
                  <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
                </button>
              </div>
            )}
            
            {/* PDF Preview Area */}
            <div className="flex-1 bg-gray-200 p-8 overflow-auto flex justify-center">
              <div 
                ref={previewAreaRef}
                className="relative bg-white shadow-2xl rounded-sm" 
                style={{ 
                  width: '100%', 
                  maxWidth: '800px',
                  minHeight: '1131px',
                }}
              >
                <iframe
                  src={`${fileUrl}#toolbar=0&navpanes=0`}
                  className="w-full h-full border-none"
                  style={{ minHeight: '1131px' }}
                  title="PDF Preview"
                />
                
                {mode === 'sign' && signatureUrl && (
                  <div
                    ref={signatureRef}
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerCancel={handlePointerUp}
                    className="absolute z-10 touch-none select-none"
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                      cursor: isDragging ? 'grabbing' : 'grab',
                    }}
                  >
                    <div 
                      className={`relative border-2 rounded-lg p-2 shadow-xl backdrop-blur-[2px] transition-all duration-150 ${isDragging ? 'border-blue-600 bg-blue-100/50 shadow-2xl' : 'border-blue-500 bg-blue-50/40'}`}
                    >
                      <img 
                        src={signatureUrl} 
                        alt="Signature Overlay" 
                        className="pointer-events-none select-none mix-blend-multiply"
                        draggable={false}
                        style={{
                          height: `${6 * scale}rem`, // base h-24 = 6rem, scaled
                          width: 'auto',
                          transition: isDragging ? 'none' : 'height 0.15s ease',
                        }}
                      />
                      <div className="absolute -top-3 -left-3 bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold shadow-md whitespace-nowrap">
                        Tanda Tangan · {scalePercent}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="px-8 py-5 border-t bg-gray-50 flex justify-between items-center">
              <p className="text-xs text-gray-400 italic">
                {mode === 'sign' ? 'Pastikan posisi dan ukuran tanda tangan sudah sesuai sebelum menyetujui.' : 'Gunakan tombol download untuk menyimpan dokumen.'}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-3 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
                >
                  Batal
                </button>
                {mode === 'sign' && signatureUrl && (
                  <button
                    onClick={handleApprove}
                    className="px-8 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Konfirmasi Posisi & Setujui
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PdfPreviewModal;
