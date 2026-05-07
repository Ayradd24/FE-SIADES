import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

interface KatalogItem {
  id: string | number;
  nama_usaha: string;
  kategori: string;
  deskripsi?: string;
  harga?: number;
  satuan?: string;
  status: 'Aktif' | 'Nonaktif' | 'Menunggu';
  user?: { id: number; name: string; username?: string };
}

const ITEMS_PER_PAGE = 10;

const ManajemenKatalog: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<KatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/katalog', {
        params: { page, limit: ITEMS_PER_PAGE, search, status: statusFilter },
      });
      setData(res.data?.data || []);
      setTotalData(res.data?.total || 0);
    } catch (err) {
      console.error(err);
      showToast('Gagal mengambil data katalog', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openDelete = (id: string | number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setActionLoading(true);
    try {
      await api.delete(`/admin/katalog/${deleteId}`);
      showToast('Katalog berhasil dihapus', 'success');
      setConfirmOpen(false);
      fetchData();
    } catch {
      showToast('Gagal menghapus katalog', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const updateStatus = async (id: string | number, newStatus: string) => {
    try {
      await api.patch(`/admin/katalog/${id}/status`, { status: newStatus });
      showToast(`Status katalog berhasil diubah menjadi ${newStatus}`, 'success');
      fetchData();
    } catch {
      showToast('Gagal mengubah status katalog', 'error');
    }
  };

  const formatRupiah = (amount?: number) => {
    if (amount === undefined || amount === null) return '-';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalData);

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <h1 className="text-3xl font-extrabold text-[#1e3a5f] mb-6">Manajemen E-Katalog</h1>

      {/* Filter & Search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari Nama Usaha..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="input-field w-40">
          <option value="">Semua Status</option>
          <option value="Aktif">Aktif</option>
          <option value="Menunggu">Menunggu</option>
          <option value="Nonaktif">Nonaktif</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-400 text-white">
                {['No', 'Nama Usaha', 'Kategori', 'Nama Warga', 'Harga', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Tidak ada katalog ditemukan</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{startItem + idx}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.nama_usaha}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.kategori}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.user?.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{formatRupiah(item.harga)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        item.status === 'Aktif' ? 'approved' : 
                        item.status === 'Menunggu' ? 'pending' : 'rejected'
                      }>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {item.status !== 'Aktif' && (
                          <button 
                            onClick={() => updateStatus(item.id, 'Aktif')}
                            className="w-8 h-8 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg flex items-center justify-center transition-colors" 
                            title="Aktifkan"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                        )}
                        {item.status === 'Aktif' && (
                          <button 
                            onClick={() => updateStatus(item.id, 'Nonaktif')}
                            className="w-8 h-8 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg flex items-center justify-center transition-colors" 
                            title="Nonaktifkan"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 115.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                        <button onClick={() => openDelete(item.id)} className="w-8 h-8 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center justify-center transition-colors" title="Hapus">
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

        {!loading && data.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold">{startItem}–{endItem}</span> dari <span className="font-semibold">{totalData}</span> data
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</Button>
              <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages || 1}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next →</Button>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
        loading={actionLoading}
        title="Hapus Katalog"
        message="Apakah kamu yakin ingin menghapus katalog ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};

export default ManajemenKatalog;
