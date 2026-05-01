import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

interface KatalogItem {
  id: string | number;
  namaUsaha: string;
  pemilik: string;
  rt: string;
  rw: string;
  kategori: string;
  status: 'Aktif' | 'Nonaktif';
  deskripsi?: string;
}

const MOCK_KATALOG: KatalogItem[] = [
  { id: 1, namaUsaha: 'Catering Nasi Box', pemilik: 'Endang', rt: '002', rw: '005', kategori: 'Kuliner', status: 'Aktif' },
  { id: 2, namaUsaha: 'Servis Listrik', pemilik: 'Bambang', rt: '001', rw: '004', kategori: 'Perbaikan', status: 'Aktif' },
  { id: 3, namaUsaha: 'Kerajinan Kayu', pemilik: 'Bejon', rt: '003', rw: '002', kategori: 'Kerajinan', status: 'Aktif' },
];

const ITEMS_PER_PAGE = 10;

const ManajemenKatalog: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<KatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRT, setFilterRT] = useState('');
  const [filterRW, setFilterRW] = useState('');
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/katalog', {
        params: { page, limit: ITEMS_PER_PAGE, search, rt: filterRT, rw: filterRW },
      });
      setData(res.data?.data || res.data);
      setTotalData(res.data?.total || res.data?.length || 0);
    } catch {
      const filtered = MOCK_KATALOG.filter(
        (k) =>
          (!search || k.namaUsaha.toLowerCase().includes(search.toLowerCase()) || k.pemilik.toLowerCase().includes(search.toLowerCase())) &&
          (!filterRT || k.rt === filterRT) &&
          (!filterRW || k.rw === filterRW)
      );
      setData(filtered);
      setTotalData(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterRT, filterRW]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openDelete = (id: string | number) => {
    setDeleteId(id);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/katalog/${deleteId}`);
      showToast('Katalog berhasil dihapus', 'success');
      setConfirmOpen(false);
      fetchData();
    } catch {
      setData((prev) => prev.filter((item) => item.id !== deleteId));
      setTotalData((prev) => prev - 1);
      showToast('Katalog berhasil dihapus', 'success');
      setConfirmOpen(false);
    } finally {
      setDeleteLoading(false);
    }
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
            placeholder="Cari Nama Usaha Atau Nama Pemilik"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10"
          />
        </div>
        <select value={filterRT} onChange={(e) => { setFilterRT(e.target.value); setPage(1); }} className="input-field w-32">
          <option value="">Semua RT</option>
          {['001', '002', '003', '004', '005'].map((rt) => <option key={rt} value={rt}>RT {rt}</option>)}
        </select>
        <select value={filterRW} onChange={(e) => { setFilterRW(e.target.value); setPage(1); }} className="input-field w-32">
          <option value="">Semua RW</option>
          {['001', '002', '003', '004', '005'].map((rw) => <option key={rw} value={rw}>RW {rw}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-400 text-white">
                {['No', 'Nama Usaha', 'Pemilik', 'RT', 'RW', 'Kategori', 'Status', 'Aksi'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-sm font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-200 rounded" /></td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400 text-sm">Tidak ada katalog ditemukan</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{startItem + idx}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.namaUsaha}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.pemilik}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.rt}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.rw}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.kategori}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === 'Aktif' ? 'active' : 'inactive'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="w-8 h-8 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg flex items-center justify-center transition-colors" title="Detail">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button className="w-8 h-8 bg-yellow-100 hover:bg-yellow-200 text-yellow-600 rounded-lg flex items-center justify-center transition-colors" title="Edit">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
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
        loading={deleteLoading}
        title="Hapus Katalog"
        message="Apakah kamu yakin ingin menghapus katalog ini? Tindakan ini tidak dapat dibatalkan."
      />
    </div>
  );
};

export default ManajemenKatalog;
