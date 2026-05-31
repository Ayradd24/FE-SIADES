import React, { useState, useEffect, useCallback, useRef } from 'react';
import api, { BASE_URL } from '../../lib/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

interface StrukturDesaItem {
  id: number;
  nama: string;
  jabatan: string;
  alamat: string;
  no_wa: string;
  foto: string | null;
  created_at: string;
  updated_at: string;
}

const JABATAN_OPTIONS = [
  'Kepala Desa',
  'Sekretaris Desa',
  'Bendahara Desa',
  'Ketua RW',
  'Ketua RT',
];

const JABATAN_ORDER: Record<string, number> = {
  'kepala desa': 0,
  'sekretaris desa': 1,
  'bendahara desa': 2,
  'ketua rw': 3,
  'ketua rt': 4,
};

function getJabatanBadgeColor(jabatan: string): string {
  const lower = jabatan.toLowerCase();
  if (lower === 'kepala desa') return 'bg-purple-100 text-purple-800';
  if (lower === 'sekretaris desa') return 'bg-blue-100 text-blue-800';
  if (lower === 'bendahara desa') return 'bg-green-100 text-green-800';
  if (lower.includes('rw')) return 'bg-amber-100 text-amber-800';
  if (lower.includes('rt')) return 'bg-orange-100 text-orange-800';
  return 'bg-gray-100 text-gray-800';
}

function sortByJabatan(a: StrukturDesaItem, b: StrukturDesaItem): number {
  const orderA = JABATAN_ORDER[a.jabatan.toLowerCase()] ?? 99;
  const orderB = JABATAN_ORDER[b.jabatan.toLowerCase()] ?? 99;
  if (orderA !== orderB) return orderA - orderB;
  return a.nama.localeCompare(b.nama);
}

const storageBaseUrl = BASE_URL.replace(/\/api$/, '') + '/storage/';
const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

interface StrukturErrors {
  foto?: string;
  user?: string;
  nomorRtRw?: string;
  dariRw?: string;
  alamat?: string;
  noWa?: string;
}

const ManajemenStrukturDesa: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<StrukturDesaItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<StrukturDesaItem | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form fields
  const [jabatan, setJabatan] = useState(JABATAN_OPTIONS[0]);
  const [nomorRtRw, setNomorRtRw] = useState('');
  const [dariRw, setDariRw] = useState('');
  const [alamat, setAlamat] = useState('');
  const [noWa, setNoWa] = useState('');
  const [fotoFile, setFotoFile] = useState<File | null>(null);
  const [fotoPreview, setFotoPreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<StrukturErrors>({});

  // Autocomplete search states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isRtRw = jabatan === 'Ketua RW' || jabatan === 'Ketua RT';

  // Delete
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Filter
  const [filterJabatan, setFilterJabatan] = useState('all');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/struktur-desa');
      const items = res.data?.data ?? res.data ?? [];
      setData(Array.isArray(items) ? items.sort(sortByJabatan) : []);
    } catch {
      showToast('Gagal memuat data struktur desa', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSearchInput = (q: string) => {
    setSearchQuery(q);
    
    if (selectedUser && q !== selectedUser.name) {
      setSelectedUser(null);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/admin/perangkat-desa/search', { params: { q } });
        setSearchResults(res.data || []);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  const resetForm = () => {
    setJabatan(JABATAN_OPTIONS[0]);
    setNomorRtRw('');
    setDariRw('');
    setAlamat('');
    setNoWa('');
    setFotoFile(null);
    setFotoPreview(null);
    setEditItem(null);
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setErrors({});
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: StrukturDesaItem) => {
    setEditItem(item);
    setSelectedUser({
      id: 'placeholder',
      name: item.nama,
      username: '',
      nik: '',
      current_role: '',
    });
    setSearchQuery(item.nama);
    setSearchResults([]);
    // Parse jabatan — e.g. "Ketua RT 001 RW 002" or "Ketua RW 003"
    const jabatanLower = item.jabatan.toLowerCase();
    if (jabatanLower.startsWith('ketua rt')) {
      setJabatan('Ketua RT');
      // Parse "Ketua RT 001 RW 002" → nomorRt="001", dariRw="002"
      const rtMatch = item.jabatan.match(/^Ketua RT\s*(\d+)/i);
      const rwMatch = item.jabatan.match(/RW\s*(\d+)/i);
      setNomorRtRw(rtMatch?.[1] || '');
      setDariRw(rwMatch?.[1] || '');
    } else if (jabatanLower.startsWith('ketua rw')) {
      setJabatan('Ketua RW');
      setNomorRtRw(item.jabatan.replace(/^Ketua RW\s*/i, '').trim());
      setDariRw('');
    } else {
      setJabatan(item.jabatan);
      setNomorRtRw('');
      setDariRw('');
    }
    setAlamat(item.alamat || '');
    setNoWa(item.no_wa || '');
    setFotoFile(null);
    setFotoPreview(item.foto ? `${storageBaseUrl}${item.foto}` : null);
    setModalOpen(true);
  };

  const openDelete = (id: number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setFotoFile(null);
      setFotoPreview(null);
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Foto harus berformat JPG atau PNG', 'error');
      setFotoFile(null);
      setFotoPreview(null);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast('Ukuran foto maksimal 2 MB', 'error');
      setFotoFile(null);
      setFotoPreview(null);
      e.target.value = '';
      return;
    }

    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    setErrors((prev) => ({ ...prev, foto: undefined }));
  };

  const validate = (): boolean => {
    const newErrors: StrukturErrors = {};

    if (!fotoFile && !fotoPreview) {
      newErrors.foto = 'Foto pejabat wajib diunggah';
    }

    if (!selectedUser) {
      newErrors.user = 'Pilih warga terlebih dahulu menggunakan pencarian';
    }

    if (isRtRw && !nomorRtRw.trim()) {
      newErrors.nomorRtRw = `Nomor ${jabatan === 'Ketua RW' ? 'RW' : 'RT'} harus diisi`;
    }

    if (jabatan === 'Ketua RT' && !dariRw.trim()) {
      newErrors.dariRw = 'Nomor RW (dari RW berapa) harus diisi';
    }

    if (!alamat.trim()) {
      newErrors.alamat = 'Alamat wajib diisi';
    }

    if (!noWa.trim()) {
      newErrors.noWa = 'Nomor WhatsApp wajib diisi';
    } else {
      if (!noWa.startsWith('08')) {
        newErrors.noWa = 'Nomor WhatsApp harus diawali dengan 08';
      } else if (noWa.length < 10 || noWa.length > 13) {
        newErrors.noWa = 'Nomor WhatsApp harus 10-13 digit';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const namaFinal = selectedUser.name;

    // Combine jabatan with nomor, e.g. "Ketua RW 003" or "Ketua RT 001 RW 002"
    let jabatanFinal = jabatan;
    if (jabatan === 'Ketua RW') {
      jabatanFinal = `Ketua RW ${nomorRtRw.trim()}`;
    } else if (jabatan === 'Ketua RT') {
      jabatanFinal = `Ketua RT ${nomorRtRw.trim()} RW ${dariRw.trim()}`;
    }

    // Check for duplicate roles
    const isDuplicate = data.some((item) => {
      if (editItem && item.id === editItem.id) return false;
      return item.jabatan.toLowerCase() === jabatanFinal.toLowerCase();
    });

    if (isDuplicate) {
      showToast(`Jabatan "${jabatanFinal}" sudah diisi oleh pejabat lain. Tidak boleh duplikasi!`, 'error');
      return;
    }

    setFormLoading(true);
    try {
      const formData = new FormData();
      formData.append('nama', namaFinal.trim());
      formData.append('jabatan', jabatanFinal);
      formData.append('alamat', alamat.trim());
      formData.append('no_wa', noWa.trim());
      if (fotoFile) {
        formData.append('foto', fotoFile);
      }

      if (editItem) {
        // Update — use POST with _method for Laravel
        formData.append('_method', 'PUT');
        await api.post(`/admin/struktur-desa/${editItem.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Data struktur desa berhasil diperbarui', 'success');
      } else {
        // Create
        await api.post('/admin/struktur-desa', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        showToast('Data struktur desa berhasil ditambahkan', 'success');
      }

      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan data';
      showToast(msg, 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/struktur-desa/${deleteId}`);
      showToast('Data berhasil dihapus', 'success');
      setConfirmOpen(false);
      fetchData();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal menghapus data', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const filteredData = filterJabatan === 'all'
    ? data
    : data.filter((item) => item.jabatan.toLowerCase() === filterJabatan.toLowerCase());

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Manajemen Struktur Desa</h1>
          <p className="text-gray-500 text-sm mt-1">
            Kelola data pejabat desa — Kepala Desa, Sekretaris, Bendahara, RW, dan RT
          </p>
        </div>
        <Button onClick={openCreate} className="shadow-lg shadow-blue-500/30">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Pejabat
        </Button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm font-medium text-gray-600">Filter Jabatan:</span>
          {['all', ...JABATAN_OPTIONS].map((opt) => (
            <button
              key={opt}
              onClick={() => setFilterJabatan(opt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${filterJabatan === opt
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {opt === 'all' ? 'Semua' : opt}
            </button>
          ))}
        </div>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
              <div className="h-3 bg-gray-200 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredData.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
          <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p className="text-gray-500 font-medium">Belum ada data pejabat desa</p>
          <p className="text-gray-400 text-sm mt-1">Klik "Tambah Pejabat" untuk menambahkan data baru</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-300 group"
            >
              <div className="flex items-start gap-4 mb-4">
                {/* Foto */}
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden ring-3 ring-white shadow-md flex-shrink-0">
                  {item.foto ? (
                    <img
                      src={`${storageBaseUrl}${item.foto}`}
                      alt={item.nama}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-blue-800/60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                    </svg>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-800 text-base truncate">{item.nama}</h3>
                  <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${getJabatanBadgeColor(item.jabatan)}`}>
                    {item.jabatan}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <button
                    onClick={() => openEdit(item)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => openDelete(item.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Details */}
              {item.alamat && (
                <div className="flex items-start gap-2 text-sm text-gray-500 mb-2 min-w-0" title={item.alamat}>
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate flex-1 min-w-0">
                    {item.alamat.length > 25 ? item.alamat.slice(0, 25) + '...' : item.alamat}
                  </span>
                </div>
              )}
              {item.no_wa && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <svg className="w-4 h-4 flex-shrink-0 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>{item.no_wa}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => !formLoading && setModalOpen(false)}
        title={editItem ? 'Edit Pejabat Desa' : 'Tambah Pejabat Desa'}
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          {/* Foto Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4">
              <div className={`w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center overflow-hidden ring-2 ${
                errors.foto ? 'ring-red-300' : 'ring-gray-200'
              }`}>
                {fotoPreview ? (
                  <img src={fotoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-10 h-10 text-blue-800/50" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFotoChange}
                  className={`block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer ${
                    errors.foto ? 'border border-red-400 rounded-lg p-2' : ''
                  }`}
                />
                {errors.foto ? (
                  <p className="text-xs text-red-500 mt-1">{errors.foto}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, max 2MB</p>
                )}
              </div>
            </div>
          </div>

          {/* Nama */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cari Warga (Nama/NIK/Username) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.user ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
              }`}
              placeholder="Ketik minimal 3 karakter..."
              value={searchQuery}
              onChange={(e) => {
                handleSearchInput(e.target.value);
                if (errors.user) setErrors((prev) => ({ ...prev, user: undefined }));
              }}
            />
            {errors.user && (
              <p className="text-xs text-red-500 mt-1">{errors.user}</p>
            )}
            
            {searchLoading && <p className="text-sm text-gray-500 mt-2">Mencari...</p>}
            
            {searchResults.length > 0 && !selectedUser && (
              <ul className="mt-1 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto bg-white absolute z-10 w-full shadow-lg left-0 right-0">
                {searchResults.map((u) => (
                  <li 
                    key={u.id} 
                    className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between items-center"
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchResults([]);
                      setSearchQuery(u.name);
                      setErrors((prev) => ({ ...prev, user: undefined }));
                      
                      // Auto-populate fields if available in selected citizen
                      if (u.alamat) setAlamat(u.alamat);
                      const wa = u.nomorWA || u.nomor_wa || u.no_wa || u.noWa;
                      if (wa) setNoWa(wa);
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.nik} | {u.username}</p>
                    </div>
                    {u.current_role && (
                      <div>
                        <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-medium">{u.current_role}</span>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            
            {selectedUser && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-900">{selectedUser.name}</p>
                  {selectedUser.nik && <p className="text-xs text-blue-700">NIK: {selectedUser.nik}</p>}
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold"
                >
                  Batal Pilih
                </button>
              </div>
            )}
          </div>

          {/* Jabatan */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Jabatan <span className="text-red-500">*</span>
            </label>
            <select
              value={jabatan}
              onChange={(e) => {
                setJabatan(e.target.value);
                // Reset nomor when switching jabatan
                if (e.target.value !== 'Ketua RW' && e.target.value !== 'Ketua RT') {
                  setNomorRtRw('');
                  setDariRw('');
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              {JABATAN_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* Nomor RT/RW — muncul hanya saat jabatan Ketua RT atau Ketua RW */}
          {isRtRw && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nomor {jabatan === 'Ketua RW' ? 'RW' : 'RT'} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nomorRtRw}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setNomorRtRw(val);
                  if (errors.nomorRtRw) setErrors((prev) => ({ ...prev, nomorRtRw: undefined }));
                }}
                maxLength={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.nomorRtRw ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
                }`}
                placeholder={`Contoh: 001, 002, 003`}
              />
              {errors.nomorRtRw ? (
                <p className="text-xs text-red-500 mt-1">{errors.nomorRtRw}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  Masukkan nomor {jabatan === 'Ketua RW' ? 'RW' : 'RT'} (contoh: 001)
                </p>
              )}
            </div>
          )}

          {/* Dari RW — muncul hanya saat jabatan Ketua RT */}
          {jabatan === 'Ketua RT' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dari RW <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={dariRw}
                onChange={(e) => {
                  const val = e.target.value.replace(/[^0-9]/g, '');
                  setDariRw(val);
                  if (errors.dariRw) setErrors((prev) => ({ ...prev, dariRw: undefined }));
                }}
                maxLength={3}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                  errors.dariRw ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
                }`}
                placeholder={`Contoh: 001, 002, 003`}
              />
              {errors.dariRw ? (
                <p className="text-xs text-red-500 mt-1">{errors.dariRw}</p>
              ) : (
                <p className="text-xs text-gray-400 mt-1">
                  RT ini termasuk dalam RW berapa?
                </p>
              )}
            </div>
          )}

          {/* Alamat */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Alamat <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={alamat}
              onChange={(e) => {
                setAlamat(e.target.value);
                if (errors.alamat) setErrors((prev) => ({ ...prev, alamat: undefined }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${
                errors.alamat ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
              }`}
              placeholder="Masukkan alamat lengkap..."
            />
            <div className="flex justify-between items-center mt-1">
              {errors.alamat ? (
                <p className="text-xs text-red-500">{errors.alamat}</p>
              ) : (
                <span />
              )}
              <p className="text-xs text-gray-400">{(alamat || '').length}/500</p>
            </div>
          </div>

          {/* No WA */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nomor WhatsApp <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={noWa}
              onChange={(e) => {
                const val = e.target.value.replace(/[^0-9]/g, '');
                if (val.length <= 13) setNoWa(val);
                if (errors.noWa) setErrors((prev) => ({ ...prev, noWa: undefined }));
              }}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                errors.noWa ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
              }`}
              placeholder="Contoh: 081234567890"
              maxLength={13}
            />
            <div className="flex justify-between items-center mt-1">
              {errors.noWa && (
                <p className="text-xs text-red-500">{errors.noWa}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setModalOpen(false)}
              disabled={formLoading}
            >
              Batal
            </Button>
            <Button type="submit" loading={formLoading}>
              {editItem ? 'Simpan Perubahan' : 'Tambah Pejabat'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirm */}
      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => !deleteLoading && setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Hapus Pejabat"
        message="Apakah Anda yakin ingin menghapus data pejabat ini? Tindakan ini tidak dapat dibatalkan."
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ManajemenStrukturDesa;
