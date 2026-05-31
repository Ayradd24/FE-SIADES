import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

interface Warga {
  id: string | number;
  namaLengkap: string;
  nomorWA: string;
  jenisKelamin: 'L' | 'P' | '-';
  alamat: string;
  nik?: string;
  nomorKK?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  email?: string;
  mustUpdateCredentials?: boolean;
}

interface WargaForm {
  namaLengkap: string;
  nomorWA: string;
  jenisKelamin: '' | 'L' | 'P';
  alamat: string;
  nik: string;
  nomorKK: string;
  tempatLahir: string;
  tanggalLahir: string;
  email: string;
}

interface WargaErrors {
  namaLengkap?: string;
  nik?: string;
  nomorKK?: string;
  nomorWA?: string;
  alamat?: string;
  jenisKelamin?: string;
  email?: string;
}

const emptyForm: WargaForm = {
  namaLengkap: '',
  nomorWA: '',
  jenisKelamin: '',
  alamat: '',
  nik: '',
  nomorKK: '',
  tempatLahir: '',
  tanggalLahir: '',
  email: '',
};

const ITEMS_PER_PAGE = 10;

const MOCK_WARGA: Warga[] = [
  { id: 1, namaLengkap: 'Herman Sumanto', nomorWA: '0812123123', jenisKelamin: 'L', alamat: 'Jl. Sigur No 14', nomorKK: '3509012345670001' },
  { id: 2, namaLengkap: 'Surti Siti', nomorWA: '0811288288', jenisKelamin: 'P', alamat: 'Jl. Ijen No 7', nomorKK: '3509012345670002' },
  { id: 3, namaLengkap: 'Budi Santoso', nomorWA: '0813445566', jenisKelamin: 'L', alamat: 'Jl. Mawar No 3', nomorKK: '3509012345670003' },
  { id: 4, namaLengkap: 'Sri Wahyuni', nomorWA: '0857112233', jenisKelamin: 'P', alamat: 'Jl. Melati No 5', nomorKK: '3509012345670004' },
];

const DataWarga: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<Warga[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');


  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [editData, setEditData] = useState<Warga | null>(null);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [detailData, setDetailData] = useState<Warga | null>(null);
  const [form, setForm] = useState<WargaForm>(emptyForm);
  const [errors, setErrors] = useState<WargaErrors>({});
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchWarga = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { page, limit: ITEMS_PER_PAGE, search },
      });
      setData(res.data?.data || res.data);
      setTotalData(res.data?.total || res.data?.length || 0);
    } catch {
      setData(MOCK_WARGA);
      setTotalData(MOCK_WARGA.length);
    } finally {
      setLoading(false);
    }
  }, [page, search]);


  useEffect(() => { fetchWarga(); }, [fetchWarga]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const openCreate = () => {
    setEditData(null);
    setForm(emptyForm);
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (warga: Warga) => {
    setEditData(warga);
    setForm({
      namaLengkap: warga.namaLengkap ?? '',
      nomorWA: warga.nomorWA ?? '',
      jenisKelamin: warga.jenisKelamin === '-' ? '' : warga.jenisKelamin,
      alamat: warga.alamat ?? '',
      nik: warga.nik ?? '',
      nomorKK: warga.nomorKK ?? '',
      tempatLahir: warga.tempatLahir ?? '',
      tanggalLahir: warga.tanggalLahir ?? '',
      email: warga.email ?? '',
    });
    setErrors({});
    setModalOpen(true);
  };

  const openDelete = (id: string | number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const openDetail = (warga: Warga) => {
    setDetailData(warga);
  };

  const validate = (): boolean => {
    const newErrors: WargaErrors = {};

    if (!form.namaLengkap.trim()) {
      newErrors.namaLengkap = 'Nama lengkap tidak boleh kosong';
    }

    if (!form.nik) {
      newErrors.nik = 'NIK tidak boleh kosong';
    } else if (form.nik.length !== 16) {
      newErrors.nik = 'NIK harus terdiri dari 16 digit';
    }

    if (!form.nomorKK) {
      newErrors.nomorKK = 'Nomor Kartu Keluarga tidak boleh kosong';
    } else if (form.nomorKK.length !== 16) {
      newErrors.nomorKK = 'Nomor Kartu Keluarga harus terdiri dari 16 digit';
    }

    if (!form.nomorWA) {
      newErrors.nomorWA = 'Nomor WA tidak boleh kosong';
    } else if (form.nomorWA.length < 10 || form.nomorWA.length > 13 || !form.nomorWA.startsWith('08')) {
      newErrors.nomorWA = 'Nomor WA harus diawali 08 dan terdiri dari 10-13 digit';
    }

    if (!form.alamat.trim()) {
      newErrors.alamat = 'Alamat tidak boleh kosong';
    }

    if (!form.jenisKelamin) {
      newErrors.jenisKelamin = 'Jenis kelamin wajib dipilih';
    }

    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setFormLoading(true);
    try {
      const payload = {
        ...form,
        nik: form.nik.trim(),
        nomorWA: form.nomorWA.trim(),
        email: form.email.trim(),
      };

      if (editData) {
        await api.put(`/admin/users/${editData.id}`, payload);
        showToast('Data warga berhasil diperbarui', 'success');
      } else {
        await api.post('/admin/users', payload);
        showToast('Warga baru berhasil ditambahkan', 'success');
      }
      setModalOpen(false);
      fetchWarga();
    } catch (err: any) {
      const firstValidation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]
        : null;
      const message = Array.isArray(firstValidation)
        ? firstValidation[0]
        : err?.response?.data?.message || 'Gagal menyimpan data. Silakan coba lagi.';
      showToast(String(message), 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteId}`);
      showToast('Data warga berhasil dihapus', 'success');
      setConfirmOpen(false);
      fetchWarga();
    } catch {
      showToast('Gagal menghapus data. Silakan coba lagi.', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalData);

  const stats = {
    total: totalData,
    lakiLaki: data.filter((w) => w.jenisKelamin === 'L').length,
    perempuan: data.filter((w) => w.jenisKelamin === 'P').length,
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <h1 className="text-3xl font-extrabold text-[#1e3a5f] mb-6">Data Warga</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Warga</p>
            <p className="text-xl font-bold text-[#1e3a5f]">{stats.total.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Laki-laki</p>
            <p className="text-xl font-bold text-[#1e3a5f]">{stats.lakiLaki.toLocaleString('id-ID')}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 flex items-center gap-4 shadow-sm">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center text-pink-500">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          </div>
          <div>
            <p className="text-xs text-gray-500">Perempuan</p>
            <p className="text-xl font-bold text-[#1e3a5f]">{stats.perempuan.toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari Nama Warga Atau Nomor WA"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="input-field pl-10"
          />
        </div>

        <Button
          variant="primary"
          onClick={openCreate}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          }
        >
          Tambah Warga Baru
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-400 text-white">
                {['No', 'Nama Lengkap', 'Nomor WA', 'L/P', 'Alamat', 'Aksi'].map((h) => (
                  <th
                    key={h}
                    className={`px-4 py-3 text-sm font-semibold whitespace-nowrap ${h === 'Aksi' ? 'text-center' : 'text-left'}`}
                    style={{ textAlign: h === 'Aksi' ? 'center' : 'left' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada data warga ditemukan
                  </td>
                </tr>
              ) : (
                data.map((warga, idx) => (
                  <tr key={warga.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{startItem + idx}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{warga.namaLengkap}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{warga.nomorWA}</td>
                    <td className="px-4 py-3">
                      <span className={`w-7 h-7 rounded-full text-xs font-bold text-white flex items-center justify-center ${warga.jenisKelamin === 'L' ? 'bg-blue-400' : warga.jenisKelamin === 'P' ? 'bg-pink-400' : 'bg-gray-400'
                        }`}>
                        {warga.jenisKelamin}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={warga.alamat}>{warga.alamat || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="w-full flex items-center justify-center gap-2">
                        {/* View */}
                        <button onClick={() => openDetail(warga)} className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors" title="Detail">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        {/* Edit */}
                        <button onClick={() => openEdit(warga)} className="w-8 h-8 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg flex items-center justify-center transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        {/* Delete */}
                        <button onClick={() => openDelete(warga.id)} className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors" title="Hapus">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold">{startItem}–{endItem}</span> dari <span className="font-semibold">{totalData}</span> data
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>
                ← Prev
              </Button>
              <span className="px-3 py-1 text-sm text-gray-600 font-medium">
                {page} / {totalPages || 1}
              </span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editData ? 'Edit Data Warga' : 'Tambah Warga Baru'}
        maxWidth="lg"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
              <input
                className={`input-field ${errors.namaLengkap ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="Nama lengkap warga"
                maxLength={255}
                value={form.namaLengkap}
                onChange={(e) => {
                  setForm({ ...form, namaLengkap: e.target.value });
                  if (errors.namaLengkap) setErrors({ ...errors, namaLengkap: undefined });
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.namaLengkap ? (
                  <p className="text-xs text-red-500">{errors.namaLengkap}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400">{(form.namaLengkap || '').length}/255</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">NIK</label>
              <input
                className={`input-field ${errors.nik ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="16 digit NIK"
                maxLength={16}
                value={form.nik}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  if (digitsOnly.length <= 16) {
                    setForm({ ...form, nik: digitsOnly });
                    if (errors.nik) setErrors({ ...errors, nik: undefined });
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.nik ? (
                  <p className="text-xs text-red-500">{errors.nik}</p>
                ) : (
                  <span />
                )}
                <p className={`text-xs ${(form.nik || '').length === 16 ? 'text-green-500' : 'text-gray-400'}`}>
                  {(form.nik || '').length}/16 digit
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">No. Kartu Keluarga</label>
              <input
                className={`input-field ${errors.nomorKK ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="16 digit No. KK"
                maxLength={16}
                value={form.nomorKK}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  if (digitsOnly.length <= 16) {
                    setForm({ ...form, nomorKK: digitsOnly });
                    if (errors.nomorKK) setErrors({ ...errors, nomorKK: undefined });
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.nomorKK ? (
                  <p className="text-xs text-red-500">{errors.nomorKK}</p>
                ) : (
                  <span />
                )}
                <p className={`text-xs ${(form.nomorKK || '').length === 16 ? 'text-green-500' : 'text-gray-400'}`}>
                  {(form.nomorKK || '').length}/16 digit
                </p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nomor WA</label>
              <input
                className={`input-field ${errors.nomorWA ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="08xxxxxxxxx"
                maxLength={13}
                value={form.nomorWA}
                onChange={(e) => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  if (digitsOnly.length <= 13) {
                    setForm({ ...form, nomorWA: digitsOnly });
                    if (errors.nomorWA) setErrors({ ...errors, nomorWA: undefined });
                  }
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.nomorWA ? (
                  <p className="text-xs text-red-500">{errors.nomorWA}</p>
                ) : (
                  <p className="text-xs text-gray-400">Contoh: 081234567890</p>
                )}
                <span className={`text-xs font-medium ${(form.nomorWA || '').length >= 10 && (form.nomorWA || '').length <= 13
                  ? 'text-green-500'
                  : (form.nomorWA || '').length > 0
                    ? 'text-red-500'
                    : 'text-gray-400'
                  }`}>
                  {(form.nomorWA || '').length}/13 digit
                </span>
              </div>
            </div>

            <div className="col-span-2 mt-4">
              <div className="border-b border-gray-200 pb-2 mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Data Demografi</h3>
              </div>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat</label>
              <textarea
                className={`input-field resize-none ${errors.alamat ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="Alamat lengkap"
                rows={3}
                maxLength={500}
                value={form.alamat}
                onChange={(e) => {
                  setForm({ ...form, alamat: e.target.value });
                  if (errors.alamat) setErrors({ ...errors, alamat: undefined });
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.alamat ? (
                  <p className="text-xs text-red-500">{errors.alamat}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400">{(form.alamat || '').length}/500</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
              <select
                className={`input-field bg-white ${errors.jenisKelamin ? 'border-red-400 focus:ring-red-300' : ''}`}
                value={form.jenisKelamin}
                onChange={(e) => {
                  setForm({ ...form, jenisKelamin: e.target.value as '' | 'L' | 'P' });
                  if (errors.jenisKelamin) setErrors({ ...errors, jenisKelamin: undefined });
                }}
              >
                <option value="">Pilih jenis kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
              {errors.jenisKelamin && (
                <p className="text-xs text-red-500 mt-1">{errors.jenisKelamin}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tempat Lahir</label>
              <input className="input-field" placeholder="Kota kelahiran" value={form.tempatLahir} onChange={(e) => setForm({ ...form, tempatLahir: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tanggal Lahir</label>
              <input type="date" className="input-field" value={form.tanggalLahir} onChange={(e) => setForm({ ...form, tanggalLahir: e.target.value })} />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
              <input
                type="email"
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="email@contoh.com"
                maxLength={255}
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
              />
              <div className="flex justify-between items-center mt-1">
                {errors.email ? (
                  <p className="text-xs text-red-500">{errors.email}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-gray-400">{(form.email || '').length}/255</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1" type="submit" loading={formLoading}>
              {editData ? 'Simpan Perubahan' : 'Tambah Warga'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />

      {/* Detail Warga */}
      <Modal
        isOpen={detailData !== null}
        onClose={() => setDetailData(null)}
        title="Detail Data Warga"
        maxWidth="lg"
      >
        {detailData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-semibold text-gray-700">Nama Lengkap:</span><p className="text-gray-600">{detailData.namaLengkap || '-'}</p></div>
            <div><span className="font-semibold text-gray-700">Nomor WA:</span><p className="text-gray-600">{detailData.nomorWA || '-'}</p></div>
            <div><span className="font-semibold text-gray-700">NIK:</span><p className="text-gray-600">{detailData.nik || '-'}</p></div>
            <div><span className="font-semibold text-gray-700">No. KK:</span><p className="text-gray-600">{detailData.nomorKK || '-'}</p></div>
            <div><span className="font-semibold text-gray-700">Jenis Kelamin:</span><p className="text-gray-600">{detailData.jenisKelamin === 'L' ? 'Laki-laki' : detailData.jenisKelamin === 'P' ? 'Perempuan' : '-'}</p></div>

            <div><span className="font-semibold text-gray-700">Tempat Lahir:</span><p className="text-gray-600">{detailData.tempatLahir || '-'}</p></div>
            <div><span className="font-semibold text-gray-700">Tanggal Lahir:</span><p className="text-gray-600">{detailData.tanggalLahir || '-'}</p></div>
            <div><span className="font-semibold text-gray-700">Email:</span><p className="text-gray-600">{detailData.email || '-'}</p></div>
            <div className="md:col-span-2"><span className="font-semibold text-gray-700">Alamat:</span><p className="text-gray-600 break-all">{detailData.alamat || '-'}</p></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DataWarga;
