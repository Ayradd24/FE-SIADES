import React, { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../lib/api';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { authStorage } from '../../lib/authStorage';

interface AdminUser {
  id: string | number;
  namaLengkap: string;
  username: string;
  nik: string;
  role: 'admin' | 'super-admin';
}

interface SearchUser {
  id: string | number;
  name: string;
  username: string;
  nik: string;
  current_role: string;
}

const ITEMS_PER_PAGE = 10;

const ManajemenPerangkat: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalData, setTotalData] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const currentUser = authStorage.getName();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  
  // Search for new admin
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<SearchUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<'admin' | 'super-admin'>('admin');
  
  const [formLoading, setFormLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/perangkat-desa', {
        params: { page, limit: ITEMS_PER_PAGE, search },
      });
      setData(res.data?.data || res.data);
      setTotalData(res.data?.total || res.data?.length || 0);
    } catch {
      showToast('Gagal memuat data perangkat desa', 'error');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, showToast]);

  useEffect(() => { fetchAdmins(); }, [fetchAdmins]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = (q: string) => {
    setSearchQuery(q);
    setError(null);

    // Clear any pending timer
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (q.length < 3) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    // Wait 500ms after last keystroke before hitting the API
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/admin/perangkat-desa/search', { params: { q } });
        setSearchResults(res.data);
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 500);
  };

  const openCreate = () => {
    setSelectedUser(null);
    setSearchQuery('');
    setSearchResults([]);
    setSelectedRole('admin');
    setError(null);
    setModalOpen(true);
  };

  const openDelete = (id: string | number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) {
      setError('Pilih warga terlebih dahulu menggunakan pencarian');
      return;
    }
    if (selectedUser.name === currentUser) {
      setError('Anda tidak bisa mengubah jabatan diri sendiri');
      return;
    }
    setFormLoading(true);
    try {
      await api.post('/admin/perangkat-desa/assign', {
        user_id: selectedUser.id,
        role: selectedRole
      });
      showToast('Jabatan berhasil diberikan', 'success');
      setModalOpen(false);
      fetchAdmins();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal memberikan jabatan', 'error');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.post(`/admin/perangkat-desa/revoke/${deleteId}`);
      showToast('Jabatan berhasil dicabut', 'success');
      setConfirmOpen(false);
      fetchAdmins();
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Gagal mencabut jabatan', 'error');
    } finally {
      setDeleteLoading(false);
      setDeleteId(null);
    }
  };

  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE) || 1;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Manajemen Perangkat Desa</h1>
          <p className="text-gray-500 text-sm mt-1">Kelola hak akses Admin dan Super Admin</p>
        </div>
        <Button onClick={openCreate} className="shadow-lg shadow-blue-500/30">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Perangkat
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 p-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-gray-50 placeholder-gray-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors sm:text-sm"
            placeholder="Cari berdasarkan nama, username, atau NIK..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Lengkap</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Username</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">NIK</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Jabatan</th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <span className="ml-2">Memuat data...</span>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Tidak ada data ditemukan</td>
                </tr>
              ) : (
                data.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{admin.namaLengkap}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{admin.nik}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admin.role === 'super-admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {admin.role === 'super-admin' ? 'Kepala Desa (Super)' : 'Admin Desa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openDelete(admin.id)}
                        className={`p-2 rounded-lg transition-colors ml-1 ${
                          admin.username === 'kepaladesa' || admin.namaLengkap === currentUser
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-red-600 hover:bg-red-50'
                        }`}
                        title={admin.namaLengkap === currentUser ? "Tidak bisa mencabut jabatan sendiri" : "Cabut Jabatan"}
                        disabled={admin.username === 'kepaladesa' || admin.namaLengkap === currentUser}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              Menampilkan {(page - 1) * ITEMS_PER_PAGE + 1} - {Math.min(page * ITEMS_PER_PAGE, totalData)} dari {totalData} data
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sebelumnnya
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => !formLoading && setModalOpen(false)}
        title="Berikan Jabatan Admin"
      >
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-1">Cari Warga (Nama/NIK/Username)</label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                error ? 'border-red-400 focus:ring-red-300' : 'border-gray-300'
              }`}
              placeholder="Ketik minimal 3 karakter..."
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
            />
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
            
            {searchLoading && <p className="text-sm text-gray-500 mt-2">Mencari...</p>}
            
            {searchResults.length > 0 && !selectedUser && (
              <ul className="mt-2 border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-40 overflow-y-auto bg-white absolute z-10 w-full shadow-lg left-0 right-0">
                {searchResults.map((u) => (
                  <li 
                    key={u.id} 
                    className="p-2 hover:bg-blue-50 cursor-pointer flex justify-between"
                    onClick={() => {
                      setSelectedUser(u);
                      setSearchResults([]);
                      setSearchQuery(u.name);
                      setError(null);
                    }}
                  >
                    <div>
                      <p className="font-medium text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">{u.nik} | {u.username}</p>
                    </div>
                    <div>
                      <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{u.current_role}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            
            {selectedUser && (
              <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-blue-900">{selectedUser.name}</p>
                  <p className="text-xs text-blue-700">NIK: {selectedUser.nik}</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setSelectedUser(null);
                    setSearchQuery('');
                  }}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Batal Pilih
                </button>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jabatan</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as 'admin' | 'super-admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
            >
              <option value="admin">Admin Desa</option>
              <option value="super-admin">Kepala Desa (Super Admin)</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={formLoading}>
              Batal
            </Button>
            <Button type="submit" loading={formLoading}>
              Simpan Jabatan
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => !deleteLoading && setConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Cabut Jabatan"
        message="Apakah Anda yakin ingin mencabut jabatan pengguna ini? Pengguna akan kembali menjadi warga biasa."
        loading={deleteLoading}
      />

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  );
};

export default ManajemenPerangkat;
