import React, { useState } from 'react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

const PengajuanSurat: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    jenisSurat: 'Surat Keterangan Usaha',
    keperluan: '',
  });
  const [file, setFile] = useState<File | null>(null);

  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.keperluan) {
      showToast('Keperluan surat harus diisi', 'error');
      return;
    }
    if (!file) {
      showToast('Dokumen pendukung harus diunggah', 'error');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('jenis_surat', form.jenisSurat);
      formData.append('keperluan', form.keperluan);
      formData.append('file', file);

      await api.post('/warga/pengajuan-surat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      showToast('Pengajuan Surat berhasil dikirim', 'success');
      setForm({ jenisSurat: 'Surat Keterangan Usaha', keperluan: '' });
      setFile(null);
    } catch (error) {
      console.error('Submission failed:', error);
      const err = error as { response?: { data?: { message?: string } } };
      showToast(err.response?.data?.message || 'Gagal mengirim pengajuan', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
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
              <option value="Surat Keterangan Usaha">Surat Keterangan Usaha</option>
              <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
              <option value="Surat Keterangan Tidak Mampu">Surat Keterangan Tidak Mampu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Keperluan</label>
            <textarea
              name="keperluan"
              rows={3}
              placeholder="Jelaskan keperluan pembuatan surat..."
              value={form.keperluan}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Upload Dokumen</label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all cursor-pointer"
            />
            {file && <p className="text-xs text-green-600 mt-1 font-medium italic">File terpilih: {file.name}</p>}
          </div>


          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PengajuanSurat;
