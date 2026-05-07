import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Robust import handling for CommonJS interop in Vite
let SignatureCanvasComponent: any = SignatureCanvas;
if (SignatureCanvasComponent.default) {
  SignatureCanvasComponent = SignatureCanvasComponent.default;
}
// Some versions might be nested even deeper or weirdly
if (typeof SignatureCanvasComponent !== 'function' && (SignatureCanvasComponent as any).SignatureCanvas) {
  SignatureCanvasComponent = (SignatureCanvasComponent as any).SignatureCanvas;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
  title: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const sigPad = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      console.log('SignatureModal opened, checking sigPad ref...');
      // Small delay to ensure canvas is rendered
      setTimeout(() => {
        if (sigPad.current) {
          console.log('sigPad ref is available:', sigPad.current);
        } else {
          console.warn('sigPad ref is STILL null after timeout');
        }
      }, 100);
    }
  }, [isOpen]);

  const clear = () => {
    if (sigPad.current) {
      if (typeof sigPad.current.clear === 'function') {
        sigPad.current.clear();
      } else if (sigPad.current.instance && typeof sigPad.current.instance.clear === 'function') {
        sigPad.current.instance.clear();
      }
    }
  };

  const save = () => {
    try {
      if (!sigPad.current) {
        console.error('Signature pad reference is not available');
        alert('Tunggu sebentar, kanvas sedang disiapkan...');
        return;
      }

      const instance = sigPad.current.instance || sigPad.current;
      
      if (typeof instance.isEmpty === 'function' && instance.isEmpty()) {
        alert('Silakan buat tanda tangan terlebih dahulu');
        return;
      }
      
      let canvas = null;
      if (typeof instance.getTrimmedCanvas === 'function') {
        canvas = instance.getTrimmedCanvas();
      } else if (typeof instance.getCanvas === 'function') {
        canvas = instance.getCanvas();
      } else if (instance.canvas) {
        canvas = instance.canvas;
      }

      if (!canvas) {
        console.error('Could not get canvas from signature pad', instance);
        throw new Error('Failed to get canvas from signature pad');
      }

      const dataUrl = canvas.toDataURL('image/png');
      if (dataUrl) {
        onConfirm(dataUrl);
      }
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Gagal mengambil gambar tanda tangan. Silakan coba lagi.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-xl font-bold text-[#1e3a5f]">{title}</h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            
            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">
                Gunakan mouse atau layar sentuh untuk membuat tanda tangan digital Anda di bawah ini.
              </p>
              
              <div className="border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 overflow-hidden h-48 relative">
                {/* We use a string ref or a callback ref to be sure we capture the instance */}
                <SignatureCanvasComponent
                  ref={(ref: any) => { sigPad.current = ref; }}
                  penColor="#1e3a5f"
                  canvasProps={{
                    className: "w-full h-full cursor-crosshair"
                  }}
                />
                <button
                  onClick={clear}
                  className="absolute bottom-3 right-3 p-2 bg-white shadow-md border border-gray-100 rounded-lg text-gray-500 hover:text-red-500 transition-colors flex items-center gap-2 text-xs font-bold"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
              </div>
            </div>

            <div className="px-6 py-4 border-t bg-gray-50 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-2.5 bg-white border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all shadow-sm"
              >
                Batal
              </button>
              <button
                onClick={save}
                className="flex-1 px-6 py-2.5 bg-blue-500 text-white font-semibold rounded-xl hover:bg-blue-600 transition-all shadow-md flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Gunakan Tanda Tangan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignatureModal;
