import React, { useEffect, useRef, useState } from 'react';
import api, { BASE_URL } from '../../lib/api';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { authStorage } from '../../lib/authStorage';

const MAX_PROFILE_PHOTO_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_PROFILE_PHOTO_TYPES = ['image/jpeg', 'image/png'];
const storageBaseUrl = BASE_URL.replace(/\/api$/, '') + '/storage/';

const ProfilSaya: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(authStorage.getProfilePhoto());
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    namaLengkap: '',
    nik: '',
    nomorkk: '',
    nomorhp: '',
    username: '',
    alamat: '',
    jenisKelamin: '',
    tempatLahir: '',
    tanggalLahir: '',
    email: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === 'nomorhp') {
      const digitsOnly = value.replace(/\D/g, '');
      if (digitsOnly.length <= 13) {
        setForm({ ...form, nomorhp: digitsOnly });
      }
      return;
    }

    setForm({ ...form, [name]: value });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const res = await api.get('/warga/profile');
        
        // PETA DATA: Konversi "L" atau "P" dari backend ke teks panjang untuk Form Dropdown
        const genderBackend = res.data?.jenisKelamin || '';
        const jenisKelaminForm = genderBackend === 'L' ? 'Laki-laki' : genderBackend === 'P' ? 'Perempuan' : '';

        setForm({
          namaLengkap: res.data?.namaLengkap || '',
          nik: res.data?.nik || '',
          nomorkk: res.data?.nomorkk || '',
          nomorhp: res.data?.nomorWA || '', // Sesuai dengan key yang dikirim oleh backend controller
          username: res.data?.username || '',
          alamat: res.data?.alamat || '',
          jenisKelamin: jenisKelaminForm,
          tempatLahir: res.data?.tempatLahir || '',
          tanggalLahir: res.data?.tanggalLahir || '',
          email: res.data?.email || '',
        });

        setProfilePhoto(res.data?.profilePhoto || null);
        authStorage.setProfilePhoto(res.data?.profilePhoto || null);
      } catch {
        showToast('Gagal memuat profil', 'error');
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [showToast]);

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;

    if (!ALLOWED_PROFILE_PHOTO_TYPES.includes(file.type)) {
      showToast('Foto profil harus berformat JPG atau PNG', 'error');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_PROFILE_PHOTO_SIZE_BYTES) {
      showToast('Ukuran foto profil maksimal 2 MB', 'error');
      e.target.value = '';
      return;
    }

    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append('profile_photo', file);
      const res = await api.post('/warga/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const nextPhoto = res.data?.profilePhoto || null;
      setProfilePhoto(nextPhoto);
      authStorage.setProfilePhoto(nextPhoto);
      window.dispatchEvent(new Event('siades-profile-photo-updated'));
      showToast('Foto profil berhasil diperbarui', 'success');
    } catch (err: any) {
      const firstValidation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]
        : null;
      const message = Array.isArray(firstValidation)
        ? firstValidation[0]
        : err?.response?.data?.message || 'Gagal mengunggah foto profil';
      showToast(String(message), 'error');
    } finally {
      setPhotoUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form.nomorhp && (form.nomorhp.length < 10 || form.nomorhp.length > 13 || !form.nomorhp.startsWith('08'))) {
      showToast('Nomor HP harus diawali 08 dan terdiri dari 10-13 digit', 'error');
      return;
    }

    if (!form.alamat.trim()) {
      showToast('Alamat wajib diisi', 'error');
      return;
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      showToast('Format email tidak valid', 'error');
      return;
    }

    setLoading(true);
    try {
      await api.put('/warga/profile', {
        namaLengkap: form.namaLengkap,
        username: form.username,
        nomorkk: form.nomorkk,
        nomorWA: form.nomorhp, // DIUBAH: Dikirim sebagai 'nomorWA' agar lolos validasi FormRequest Laravel
        alamat: form.alamat,
        jenisKelamin: form.jenisKelamin === 'Laki-laki' ? 'L' : 'P', // DIUBAH: Konversi string ke inisial 'L'/'P' sebelum dikirim
        tempatLahir: form.tempatLahir,
        tanggalLahir: form.tanggalLahir,
        email: form.email || null,
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
          <button
            type="button"
            onClick={() => profilePhoto && setPhotoPreviewOpen(true)}
            disabled={!profilePhoto}
            className="w-24 h-24 bg-blue-200 rounded-full flex items-center justify-center text-blue-800 shadow-sm overflow-hidden disabled:cursor-default focus:outline-none focus:ring-2 focus:ring-blue-300"
            title={profilePhoto ? 'Lihat foto profil' : undefined}
          >
            {profilePhoto ? (
              <img
                src={`${storageBaseUrl}${profilePhoto}`}
                alt="Foto profil"
                className="w-full h-full object-cover"
              />
            ) : (
              <svg className="w-14 h-14" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
              </svg>
            )}
          </button>
          <input
            ref={photoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            disabled={fetching || photoUploading}
            className="mt-3 text-sm font-semibold text-blue-500 hover:text-blue-700 transition-colors disabled:text-gray-400"
          >
            {photoUploading ? 'Mengunggah...' : 'Ubah Foto Profil'}
          </button>
          <p className="text-xs text-gray-400 mt-1">JPG/PNG, maksimal 2 MB</p>
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
              maxLength={255}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
              disabled={fetching}
            />
            <div className="flex justify-between items-center mt-1">
              <span />
              <p className="text-xs text-gray-400">{(form.namaLengkap || '').length}/255</p>
            </div>
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
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-400">NIK tidak dapat diubah secara mandiri. Hubungi admin desa jika ada kesalahan.</p>
              <p className="text-xs text-gray-400">{(form.nik || '').length}/16 digit</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Nomor Kartu Keluarga</label>
            <input
              type="text"
              name="nomorkk"
              value={form.nomorkk}
              readOnly
              className="w-full px-4 py-2 border border-gray-200 bg-gray-50 text-gray-500 rounded-xl outline-none cursor-not-allowed"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-gray-400">Nomor Kartu Keluarga tidak dapat diubah secara mandiri. Hubungi admin desa jika ada kesalahan.</p>
              <p className="text-xs text-gray-400">{(form.nomorkk || '').length}/16 digit</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Nomor Handphone</label>
            <input
              type="text"
              name="nomorhp"
              value={form.nomorhp}
              onChange={handleChange}
              disabled={fetching}
              placeholder="08xxxxxxxxxx"
              maxLength={13}
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all ${form.nomorhp && (!form.nomorhp.startsWith('08') || form.nomorhp.length < 10)
                ? 'border-red-400'
                : 'border-gray-300'
                }`}
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${form.nomorhp && (!form.nomorhp.startsWith('08') || form.nomorhp.length < 10)
                ? 'text-red-500'
                : 'text-gray-400'
                }`}>
                {form.nomorhp && !form.nomorhp.startsWith('08')
                  ? 'Nomor HP harus diawali dengan 08'
                  : form.nomorhp && form.nomorhp.length < 10
                    ? 'Nomor HP minimal 10 digit'
                    : 'Contoh: 081234567890'}
              </p>
              <p className="text-xs text-gray-400">{(form.nomorhp || '').length}/13 digit</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              maxLength={255}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
              disabled={fetching}
            />
            <div className="flex justify-between items-center mt-1">
              <span />
              <p className="text-xs text-gray-400">{(form.username || '').length}/255</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Alamat Lengkap<span className="text-red-500">*</span></label>
            <textarea
              name="alamat"
              rows={3}
              value={form.alamat}
              onChange={handleChange}
              required
              maxLength={500}
              placeholder="Alamat lengkap"
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all resize-none ${!form.alamat.trim() && form.alamat !== undefined ? 'border-red-400' : 'border-gray-300'}`}
              disabled={fetching}
            ></textarea>
            <div className="flex justify-between items-center mt-1">
              <span />
              <p className="text-xs text-gray-400">{(form.alamat || '').length}/500</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Jenis Kelamin</label>
              <select
                name="jenisKelamin"
                value={form.jenisKelamin}
                onChange={handleChange}
                disabled={fetching}
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all bg-white"
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="Laki-laki">Laki-laki</option>
                <option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Tempat Lahir</label>
              <input
                type="text"
                name="tempatLahir"
                value={form.tempatLahir}
                onChange={handleChange}
                disabled={fetching}
                placeholder="Kota kelahiran"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Tanggal Lahir</label>
            <input
              type="date"
              name="tanggalLahir"
              value={form.tanggalLahir}
              onChange={handleChange}
              disabled={fetching}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              disabled={fetching}
              maxLength={255}
              placeholder="email@contoh.com"
              className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 outline-none transition-all ${form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                ? 'border-red-400'
                : 'border-gray-300'
                }`}
            />
            <div className="flex justify-between items-center mt-1">
              <p className={`text-xs ${form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                ? 'text-red-500'
                : 'text-gray-400'
                }`}>
                {form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
                  ? 'Format email tidak valid'
                  : ''}
              </p>
              <p className="text-xs text-gray-400">{(form.email || '').length}/255</p>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <Button type="submit" disabled={loading}>
              {fetching ? 'Memuat...' : loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>

      {photoPreviewOpen && profilePhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6"
          onClick={() => setPhotoPreviewOpen(false)}
        >
          <div
            className="relative max-h-full max-w-3xl overflow-hidden rounded-2xl bg-white p-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPhotoPreviewOpen(false)}
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-gray-700 shadow hover:bg-white"
              aria-label="Tutup preview foto"
            >
              x
            </button>
            <img
              src={`${storageBaseUrl}${profilePhoto}`}
              alt="Preview foto profil"
              className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilSaya;
