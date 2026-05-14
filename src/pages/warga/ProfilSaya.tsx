import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { authStorage } from '../../lib/authStorage';

const ProfilSaya: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState({
    namaLengkap: '',
    nik: '',
    nomorkk: '',
    username: '',
    alamat: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const res = await api.get('/warga/profile');
        setForm({
          namaLengkap: res.data?.namaLengkap || '',
          nik: res.data?.nik || '',
          nomorkk: res.data?.nomorkk || '',
          username: res.data?.username || '',
          alamat: res.data?.alamat || '',
        });
      } catch {
        showToast('Gagal memuat profil', 'error');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.put('/warga/profile', {
        namaLengkap: form.namaLengkap,
        username: form.username,
        nomorkk: form.nomorkk,
        alamat: form.alamat,
      });
      setLoading(false);
      authStorage.setName(form.namaLengkap);
      showToast('Profil berhasil diperbarui', 'success');
    } catch (err: any) {
      const firstValidation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]
        : null;
      const message = Array.isArray(firstValidation)
        ? firstValidation[0]
        : err?.response?.data?.message || 'Gagal memperbarui profil';
      showToast(String(message), 'error');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-50">
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Profil Saya</h1>
        <p className="text-gray-500 mb-8">Kelola informasi data diri Anda.</p>

        <div className="flex flex-col items-center mb-8">
          <div className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 shadow-sm">
            <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
            </svg>
          </div>
          <button className="mt-3 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors">
            Ubah Foto Profil
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Nama Lengkap</label>
            <input
              type="text"
              name="namaLengkap"
              value={form.namaLengkap}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
              disabled={fetching}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">NIK</label>
            <input
              type="text"
              name="nik"
              value={form.nik}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">NIK tidak dapat diubah secara mandiri. Hubungi admin desa jika ada kesalahan.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Nomor Kartu Keluarga</label>
            <input
              type="text"
              name="nomorkk"
              value={form.nomorkk}
              onChange={handleChange}
              disabled={fetching}
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed"
            />
            <p className="text-xs text-gray-400 mt-1">Nomor Kartu Keluarga tidak dapat diubah secara mandiri. Hubungi admin desa jika ada kesalahan.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
              disabled={fetching}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Alamat Lengkap</label>
            <textarea
              name="alamat"
              rows={3}
              value={form.alamat}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
              disabled={fetching}
            ></textarea>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" disabled={loading}>
              {fetching ? 'Memuat...' : loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilSaya;
