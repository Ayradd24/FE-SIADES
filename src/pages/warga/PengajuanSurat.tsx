import React, { useRef, useState, useEffect } from 'react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';



const MAX_PDF_SIZE_BYTES = 1536 * 1024;

const PengajuanSurat: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [jenisSuratOptions, setJenisSuratOptions] = useState<string[]>([
    'Surat Keterangan Usaha',
    'Surat Keterangan Domisili',
    'Surat Keterangan Tidak Mampu',
  ]);

  const [form, setForm] = useState({ jenisSurat: 'Surat Keterangan Usaha' });
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);





  useEffect(() => {
    const fetchJenisSurat = async () => {
      try {
        const res = await api.get('/jenis-surat');
        const names = (res.data ?? [])
          .map((item: { nama?: string }) => item.nama)
          .filter((name: string | undefined): name is string => Boolean(name));
        if (names.length > 0) {
          setJenisSuratOptions(names);
          setForm((prev) => ({ ...prev, jenisSurat: names[0] }));
        }
      } catch { /* fallback */ }
    };
    fetchJenisSurat();
  }, []);

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
    if (!file) { showToast('Dokumen pendukung harus diunggah', 'error'); return; }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('jenis_surat', form.jenisSurat);
      formData.append('file', file);
      await api.post('/warga/pengajuan-surat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      showToast('Pengajuan Surat berhasil dikirim', 'success');
      setForm({ jenisSurat: jenisSuratOptions[0] ?? 'Surat Keterangan Usaha' });
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
              name="jenisSurat"
              value={form.jenisSurat}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            >
              {jenisSuratOptions.map((jenis) => (
                <option key={jenis} value={jenis}>{jenis}</option>
              ))}
            </select>
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
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PengajuanSurat;