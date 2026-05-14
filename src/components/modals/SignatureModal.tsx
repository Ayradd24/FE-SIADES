import React, { useRef, useEffect, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, RotateCcw, Check, Image as ImageIcon, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import signatureService from '../../lib/signatureService';
import type { AdminSignature } from '../../lib/signatureService';
import { BASE_URL } from '../../lib/api';

// Robust import handling for CommonJS interop in Vite
type SignatureCanvasLike = {
  clear?: () => void;
  isEmpty?: () => boolean;
  getTrimmedCanvas?: () => HTMLCanvasElement;
  getCanvas?: () => HTMLCanvasElement;
  canvas?: HTMLCanvasElement;
  instance?: SignatureCanvasLike;
};

const signatureCanvasModule = SignatureCanvas as unknown as {
  default?: React.ComponentType<Record<string, unknown>>;
  SignatureCanvas?: React.ComponentType<Record<string, unknown>>;
};

let SignatureCanvasComponent: React.ComponentType<Record<string, unknown>> = SignatureCanvas as unknown as React.ComponentType<Record<string, unknown>>;
if (signatureCanvasModule.default) {
  SignatureCanvasComponent = signatureCanvasModule.default;
}
if (typeof SignatureCanvasComponent !== 'function' && signatureCanvasModule.SignatureCanvas) {
  SignatureCanvasComponent = signatureCanvasModule.SignatureCanvas;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (signatureDataUrl: string) => void;
  title: string;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const sigPad = useRef<SignatureCanvasLike | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<AdminSignature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [activeTab, setActiveTab] = useState<'draw' | 'saved'>('draw');

  const fetchSignatures = async () => {
    try {
      setIsLoading(true);
      const data = await signatureService.getAll();
      setSavedSignatures(data);
      if (data.length > 0) {
        setActiveTab('saved');
      }
    } catch (err) {
      console.error('Failed to fetch signatures:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    if (sigPad.current) {
      const instance = sigPad.current.instance || sigPad.current;
      if (typeof instance.clear === 'function') {
        instance.clear();
      }
    }
  };

  const handleSaveNew = async () => {
    try {
      if (!sigPad.current) return;
      const instance = sigPad.current.instance || sigPad.current;
      
      if (typeof instance.isEmpty === 'function' && instance.isEmpty()) {
        alert('Silakan buat tanda tangan terlebih dahulu');
        return;
      }
      
      let canvas = null;
      if (typeof instance.getTrimmedCanvas === 'function') {
        canvas = instance.getTrimmedCanvas();
      } else {
        canvas = instance.getCanvas ? instance.getCanvas() : instance.canvas;
      }

      if (!canvas) throw new Error('Failed to get canvas');

      const dataUrl = canvas.toDataURL('image/png');

      if (saveForLater) {
        if (!signatureName) {
          alert('Berikan nama untuk tanda tangan yang akan disimpan');
          return;
        }
        setIsLoading(true);
        await signatureService.store(signatureName, dataUrl);
        setIsLoading(false);
      }

      onConfirm(dataUrl);
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Gagal menyimpan tanda tangan');
      setIsLoading(false);
    }
  };

  const handleSelectSaved = async (sig: AdminSignature) => {
    // Construct full URL using the same base logic as the images in the list
    const storageBaseUrl = BASE_URL.replace('/api', '') + '/storage/';
    const fullUrl = `${storageBaseUrl}${sig.file_path}`;
    onConfirm(fullUrl);
  };

  const handleDeleteSaved = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Hapus tanda tangan ini?')) return;
    try {
      await signatureService.delete(id);
      setSavedSignatures(prev => prev.filter(s => s.id !== id));
    } catch {
      alert('Gagal menghapus tanda tangan');
    }
  };

  useEffect(() => {
    if (isOpen) {
      void fetchSignatures();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-xl flex flex-col overflow-hidden border border-gray-100"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500">Kelola tanda tangan digital Anda</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex border-b bg-gray-50/50">
              <button
                onClick={() => setActiveTab('draw')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'draw' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <RotateCcw className="w-4 h-4" /> Gambar Baru
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'saved' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Tersimpan ({savedSignatures.length})
              </button>
            </div>
            
            <div className="p-8 min-h-[300px]">
              {activeTab === 'draw' ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 overflow-hidden h-56 relative group">
                    <SignatureCanvasComponent
                      ref={(ref: unknown) => { sigPad.current = ref as SignatureCanvasLike | null; }}
                      penColor="#1e293b"
                      canvasProps={{ className: "w-full h-full cursor-crosshair" }}
                    />
                    <button
                      onClick={clear}
                      className="absolute bottom-4 right-4 p-2.5 bg-white shadow-lg border border-gray-100 rounded-xl text-gray-500 hover:text-red-500 transition-all flex items-center gap-2 text-xs font-bold"
                    >
                      <RotateCcw className="w-4 h-4" /> Reset
                    </button>
                  </div>

                  <div className="mt-6 space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                      <input
                        type="checkbox"
                        id="saveLater"
                        checked={saveForLater}
                        onChange={(e) => setSaveForLater(e.target.checked)}
                        className="w-5 h-5 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500"
                      />
                      <label htmlFor="saveLater" className="text-sm font-semibold text-blue-900 cursor-pointer">
                        Simpan tanda tangan ini untuk penggunaan berikutnya
                      </label>
                    </div>

                    {saveForLater && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 ml-1"> Nama Tanda Tangan </label>
                        <input
                          type="text"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          placeholder="Contoh: Tanda Tangan Utama"
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="mt-4 text-sm text-gray-500 font-medium">Memuat tanda tangan...</p>
                    </div>
                  ) : savedSignatures.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4">
                      {savedSignatures.map((sig) => (
                        <div
                          key={sig.id}
                          onClick={() => handleSelectSaved(sig)}
                          className="group relative border-2 border-gray-100 rounded-2xl p-4 bg-white hover:border-blue-500 hover:shadow-xl transition-all cursor-pointer"
                        >
                          <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl mb-3 overflow-hidden">
                            <img src={`${BASE_URL.replace('/api', '')}/storage/${sig.file_path}`} alt={sig.signature_name} className="max-h-full max-w-full object-contain" />
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-gray-700 truncate">{sig.signature_name}</p>
                            <button
                              onClick={(e) => handleDeleteSaved(e, sig.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <ImageIcon className="w-8 h-8 text-gray-300" />
                      </div>
                      <p className="text-gray-500 font-medium">Belum ada tanda tangan tersimpan</p>
                      <button onClick={() => setActiveTab('draw')} className="mt-2 text-blue-600 font-bold text-sm hover:underline">Buat baru sekarang</button>
                    </div>
                  )}
                </motion.div>
              )}
            </div>

            <div className="px-8 py-6 border-t bg-gray-50/50 flex gap-4">
              <button
                onClick={onClose}
                className="px-6 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all flex-1 shadow-sm"
              >
                Batal
              </button>
              {activeTab === 'draw' && (
                <button
                  onClick={handleSaveNew}
                  disabled={isLoading}
                  className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all flex-[2] shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Menyimpan...' : <><Check className="w-5 h-5" /> Gunakan & Simpan</>}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignatureModal;
