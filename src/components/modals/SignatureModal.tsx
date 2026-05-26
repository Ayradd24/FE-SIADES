import React, { useEffect, useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Check, Image as ImageIcon, RotateCcw, Stamp, Trash2, Upload, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import signatureService from '../../lib/signatureService';
import type { AdminSignature } from '../../lib/signatureService';
import stampService from '../../lib/stampService';
import type { AdminStamp } from '../../lib/stampService';
import { BASE_URL } from '../../lib/api';

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

export interface ApprovalAssets {
  signatureUrl: string;
  stampUrl?: string;
}

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (assets: ApprovalAssets) => void;
  title: string;
}

const storageBaseUrl = `${BASE_URL.replace(/\/api$/, '')}/storage/`;

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, title }) => {
  const sigPad = useRef<SignatureCanvasLike | null>(null);
  const [savedSignatures, setSavedSignatures] = useState<AdminSignature[]>([]);
  const [savedStamps, setSavedStamps] = useState<AdminStamp[]>([]);
  const [selectedSignatureUrl, setSelectedSignatureUrl] = useState('');
  const [selectedStampUrl, setSelectedStampUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [saveForLater, setSaveForLater] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [stampName, setStampName] = useState('');
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<'signature' | 'stamp'>('signature');

  const fetchAssets = async () => {
    try {
      setIsLoading(true);
      const [signatures, stamps] = await Promise.all([
        signatureService.getAll(),
        stampService.getAll(),
      ]);
      setSavedSignatures(signatures);
      setSavedStamps(stamps);
    } catch (err) {
      console.error('Failed to fetch approval assets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    const instance = sigPad.current?.instance || sigPad.current;
    if (typeof instance?.clear === 'function') {
      instance.clear();
    }
  };

  const getDrawnSignatureDataUrl = () => {
    const instance = sigPad.current?.instance || sigPad.current;
    if (!instance) return null;

    if (typeof instance.isEmpty === 'function' && instance.isEmpty()) {
      return null;
    }

    const canvas = typeof instance.getTrimmedCanvas === 'function'
      ? instance.getTrimmedCanvas()
      : instance.getCanvas?.() || instance.canvas;

    return canvas?.toDataURL('image/png') || null;
  };

  const handleUseDrawnSignature = async () => {
    try {
      const dataUrl = getDrawnSignatureDataUrl();
      if (!dataUrl) {
        alert('Silakan buat tanda tangan terlebih dahulu');
        return;
      }

      if (saveForLater) {
        if (!signatureName.trim()) {
          alert('Berikan nama untuk tanda tangan yang akan disimpan');
          return;
        }
        setIsLoading(true);
        await signatureService.store(signatureName.trim(), dataUrl);
        await fetchAssets();
        setSignatureName('');
        setSaveForLater(false);
      }

      setSelectedSignatureUrl(dataUrl);
    } catch (err) {
      console.error('Error saving signature:', err);
      alert('Gagal menyimpan tanda tangan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectSavedSignature = (sig: AdminSignature) => {
    setSelectedSignatureUrl(`${storageBaseUrl}${sig.file_path}`);
  };

  const handleDeleteSavedSignature = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Hapus tanda tangan ini?')) return;
    try {
      await signatureService.delete(id);
      setSavedSignatures((prev) => prev.filter((sig) => sig.id !== id));
    } catch {
      alert('Gagal menghapus tanda tangan');
    }
  };

  const handleUploadStamp = async () => {
    if (!stampName.trim()) {
      alert('Berikan nama untuk stempel');
      return;
    }
    if (!stampFile) {
      alert('Pilih file stempel terlebih dahulu');
      return;
    }

    try {
      setUploadingStamp(true);
      const stamp = await stampService.store(stampName.trim(), stampFile);
      setSavedStamps((prev) => [stamp, ...prev]);
      setSelectedStampUrl(`${storageBaseUrl}${stamp.file_path}`);
      setStampName('');
      setStampFile(null);
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Gagal mengunggah stempel');
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleDeleteStamp = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!confirm('Hapus stempel ini?')) return;
    try {
      await stampService.delete(id);
      setSavedStamps((prev) => prev.filter((stamp) => stamp.id !== id));
    } catch {
      alert('Gagal menghapus stempel');
    }
  };

  const handleConfirm = () => {
    if (!selectedSignatureUrl) {
      alert('Pilih atau buat tanda tangan terlebih dahulu');
      setActiveTab('signature');
      return;
    }
    onConfirm({ signatureUrl: selectedSignatureUrl, stampUrl: selectedStampUrl || undefined });
  };

  useEffect(() => {
    if (isOpen) {
      setActiveTab('signature');
      setSelectedSignatureUrl('');
      setSelectedStampUrl('');
      void fetchAssets();
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
            className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden border border-gray-100"
          >
            <div className="flex items-center justify-between px-8 py-6 border-b">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-500">Pilih tanda tangan, lalu tambahkan stempel jika diperlukan</p>
              </div>
              <button type="button" onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="flex border-b bg-gray-50/50">
              <button
                type="button"
                onClick={() => setActiveTab('signature')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'signature' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Tanda Tangan {selectedSignatureUrl ? '(Dipilih)' : ''}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('stamp')}
                className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'stamp' ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Stamp className="w-4 h-4" /> Stempel Opsional {selectedStampUrl ? '(Dipilih)' : ''}
              </button>
            </div>

            <div className="p-8 overflow-auto">
              {activeTab === 'signature' ? (
                <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Gambar tanda tangan baru</p>
                    <div className="border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50 overflow-hidden h-56 relative group">
                      <SignatureCanvasComponent
                        ref={(ref: unknown) => { sigPad.current = ref as SignatureCanvasLike | null; }}
                        penColor="#1e293b"
                        canvasProps={{ className: 'w-full h-full cursor-crosshair' }}
                      />
                      <button
                        type="button"
                        onClick={clear}
                        className="absolute bottom-4 right-4 p-2.5 bg-white shadow-lg border border-gray-100 rounded-xl text-gray-500 hover:text-red-500 transition-all flex items-center gap-2 text-xs font-bold"
                      >
                        <RotateCcw className="w-4 h-4" /> Reset
                      </button>
                    </div>

                    <div className="mt-5 space-y-4">
                      <label className="flex items-center gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                        <input
                          type="checkbox"
                          checked={saveForLater}
                          onChange={(e) => setSaveForLater(e.target.checked)}
                          className="w-5 h-5 rounded-lg border-blue-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-semibold text-blue-900">Simpan tanda tangan ini untuk penggunaan berikutnya</span>
                      </label>

                      {saveForLater && (
                        <input
                          type="text"
                          value={signatureName}
                          onChange={(e) => setSignatureName(e.target.value)}
                          placeholder="Nama tanda tangan"
                          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                        />
                      )}

                      <button
                        type="button"
                        onClick={handleUseDrawnSignature}
                        disabled={isLoading}
                        className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        Gunakan Tanda Tangan Ini
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Tanda tangan tersimpan</p>
                    {isLoading ? (
                      <div className="py-12 text-center text-sm font-medium text-gray-500">Memuat tanda tangan...</div>
                    ) : savedSignatures.length > 0 ? (
                      <div className="grid grid-cols-2 gap-4">
                        {savedSignatures.map((sig) => {
                          const url = `${storageBaseUrl}${sig.file_path}`;
                          const selected = selectedSignatureUrl === url;
                          return (
                            <button
                              key={sig.id}
                              type="button"
                              onClick={() => handleSelectSavedSignature(sig)}
                              className={`group relative border-2 rounded-2xl p-4 bg-white hover:border-blue-500 hover:shadow-xl transition-all text-left ${
                                selected ? 'border-blue-500 shadow-lg' : 'border-gray-100'
                              }`}
                            >
                              <div className="h-24 flex items-center justify-center bg-gray-50 rounded-xl mb-3 overflow-hidden">
                                <img src={url} alt={sig.signature_name} className="max-h-full max-w-full object-contain" />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-gray-700 truncate">{sig.signature_name}</p>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => handleDeleteSavedSignature(e, sig.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') handleDeleteSavedSignature(e as unknown as React.MouseEvent, sig.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-sm font-medium text-gray-500">Belum ada tanda tangan tersimpan</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Unggah stempel baru</p>
                    <div className="space-y-4 rounded-2xl border border-gray-100 bg-gray-50 p-5">
                      <input
                        type="text"
                        value={stampName}
                        onChange={(e) => setStampName(e.target.value)}
                        placeholder="Nama stempel"
                        className="w-full px-5 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                      />
                      <label className="block rounded-2xl border-2 border-dashed border-gray-200 bg-white p-5 text-center cursor-pointer hover:border-blue-400 transition-colors">
                        <Upload className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                        <span className="block text-sm font-bold text-gray-700">{stampFile ? stampFile.name : 'Pilih file PNG transparan'}</span>
                        <span className="block text-xs text-gray-400 mt-1">PNG saja, maksimal 2 MB</span>
                        <input
                          type="file"
                          accept="image/png,.png"
                          className="hidden"
                          onChange={(e) => setStampFile(e.target.files?.[0] || null)}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={handleUploadStamp}
                        disabled={uploadingStamp}
                        className="w-full px-5 py-3 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 transition-all"
                      >
                        {uploadingStamp ? 'Mengunggah...' : 'Unggah & Gunakan Stempel'}
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-bold text-gray-700 mb-3">Stempel tersimpan</p>
                    {isLoading ? (
                      <div className="py-12 text-center text-sm font-medium text-gray-500">Memuat stempel...</div>
                    ) : savedStamps.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {savedStamps.map((stamp) => {
                          const url = `${storageBaseUrl}${stamp.file_path}`;
                          const selected = selectedStampUrl === url;
                          return (
                            <button
                              key={stamp.id}
                              type="button"
                              onClick={() => setSelectedStampUrl(url)}
                              className={`group relative border-2 rounded-2xl p-4 bg-white hover:border-blue-500 hover:shadow-xl transition-all text-left ${
                                selected ? 'border-blue-500 shadow-lg' : 'border-gray-100'
                              }`}
                            >
                              <div className="h-28 flex items-center justify-center bg-gray-50 rounded-xl mb-3 overflow-hidden">
                                <img src={url} alt={stamp.stamp_name} className="max-h-full max-w-full object-contain" />
                              </div>
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-xs font-bold text-gray-700 truncate">{stamp.stamp_name}</p>
                                <span
                                  role="button"
                                  tabIndex={0}
                                  onClick={(e) => handleDeleteStamp(e, stamp.id)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') handleDeleteStamp(e as unknown as React.MouseEvent, stamp.id);
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="py-12 text-center text-sm font-medium text-gray-500">Belum ada stempel tersimpan</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="px-8 py-6 border-t bg-gray-50/50 flex gap-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3.5 bg-white border border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all flex-1 shadow-sm"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedSignatureUrl}
                className="px-6 py-3.5 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex-[2] shadow-lg shadow-blue-200 flex items-center justify-center gap-2"
              >
                <Check className="w-5 h-5" /> Lanjut Posisikan
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SignatureModal;
