import React, { useRef, useState, useEffect } from 'react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';



const MAX_PDF_SIZE_BYTES = 1536 * 1024;

interface JenisSuratOption {
  id: number;
  nama: string;
}

const PengajuanSurat: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingJenisSurat, setLoadingJenisSurat] = useState(true);
  const [jenisSuratOptions, setJenisSuratOptions] = useState<JenisSuratOption[]>([]);

  const [form, setForm] = useState({ jenisSuratId: '' });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);





  useEffect(() => {
    const fetchJenisSurat = async () => {
      try {
        const res = await api.get('/jenis-surat');
        const options = (res.data ?? [])
          .map((item: { id?: number; nama?: string }) => ({
            id: Number(item.id),
            nama: item.nama,
          }))
          .filter((item: { id: number; nama?: string }): item is JenisSuratOption => (
            Number.isInteger(item.id) && item.id > 0 && Boolean(item.nama)
          ));

        setJenisSuratOptions(options);
        setForm({ jenisSuratId: options[0]?.id ? String(options[0].id) : '' });
      } catch {
        setJenisSuratOptions([]);
        setForm({ jenisSuratId: '' });
        showToast('Gagal memuat jenis surat.', 'error');
      } finally {
        setLoadingJenisSurat(false);
      }
    };
    fetchJenisSurat();
  }, [showToast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null;

    if (!selectedFile) {
      setFile(null);
      return;
    }

    const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      showToast('Dokumen harus berupa file PDF.', 'error');
      setFile(null);
      e.target.value = '';
      return;
    }

    if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
      showToast('Ukuran PDF maksimal 1.5 MB.', 'error');
      setFile(null);
      e.target.value = '';
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.jenisSuratId) { showToast('Jenis surat belum tersedia.', 'error'); return; }
    if (!file) { showToast('Dokumen pendukung harus diunggah', 'error'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('jenis_surat_id', form.jenisSuratId);
      formData.append('file', file);
      await api.post('/warga/pengajuan-surat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Pengajuan Surat berhasil dikirim', 'success');
      setForm({ jenisSuratId: jenisSuratOptions[0]?.id ? String(jenisSuratOptions[0].id) : '' });
      setFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

    } catch (error: any) {
      const firstValidation = error?.response?.data?.errors
        ? Object.values(error.response.data.errors)[0] : null;
      const message = Array.isArray(firstValidation)
        ? firstValidation[0]
        : error?.response?.data?.message || 'Gagal mengirim pengajuan';
      showToast(String(message), 'error');
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Form Pengajuan */}
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-50">
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Pengajuan Surat</h1>
        <p className="text-gray-500 mb-6">Silakan lengkapi formulir di bawah ini untuk mengajukan pembuatan surat.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Jenis Surat</label>
            <select
              name="jenisSuratId"
              value={form.jenisSuratId}
              onChange={handleChange}
              disabled={loadingJenisSurat || jenisSuratOptions.length === 0}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            >
              {loadingJenisSurat && <option value="">Memuat jenis surat...</option>}
              {!loadingJenisSurat && jenisSuratOptions.length === 0 && (
                <option value="">Belum ada jenis surat tersedia</option>
              )}
              {jenisSuratOptions.map((jenis) => (
                <option key={jenis.id} value={jenis.id}>{jenis.nama}</option>
              ))}
            </select>
            {!loadingJenisSurat && jenisSuratOptions.length === 0 && (
              <p className="text-xs text-red-500 mt-1">Pengajuan belum bisa dikirim karena jenis surat belum tersedia.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Upload Dokumen</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Format: PDF, maksimal 1.5 MB.</p>
            {file && <p className="text-xs text-green-600 mt-1 font-medium italic">File terpilih: {file.name}</p>}
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={loading || loadingJenisSurat || jenisSuratOptions.length === 0} className="w-full">
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PengajuanSurat;
