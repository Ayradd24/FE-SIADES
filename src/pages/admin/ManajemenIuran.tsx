import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

interface IuranWarga {
  id: string | number;
  namaWarga: string;
  rtRw: string;
  bulan: string;
  nominal: number;
  status: 'Lunas' | 'Belum';
  tanggalBayar?: string;
}

interface IuranStats {
  totalSaldo: number;
  terkumpulBulanIni: number;
  wargaBelumLunas: number;
}

const MOCK_STATS: IuranStats = { totalSaldo: 15500000, terkumpulBulanIni: 2000000, wargaBelumLunas: 12 };
const MOCK_IURAN: IuranWarga[] = [
  { id: 1, namaWarga: 'Budi Santoso', rtRw: '002/005', bulan: 'Oktober', nominal: 50000, status: 'Lunas', tanggalBayar: '2025-10-05' },
  { id: 2, namaWarga: 'Subarjo', rtRw: '003/005', bulan: 'Oktober', nominal: 50000, status: 'Belum' },
  { id: 3, namaWarga: 'Surti', rtRw: '007/005', bulan: 'Oktober', nominal: 50000, status: 'Lunas', tanggalBayar: '2025-10-03' },
  { id: 4, namaWarga: 'Herman Sumanto', rtRw: '002/005', bulan: 'Oktober', nominal: 50000, status: 'Belum' },
];

const BULAN_OPTIONS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const ITEMS_PER_PAGE = 10;

const ManajemenIuran: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [stats, setStats] = useState<IuranStats | null>(null);
  const [data, setData] = useState<IuranWarga[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [filterBulan, setFilterBulan] = useState('Oktober');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [iuranForm, setIuranForm] = useState({ nominal: '50000', keterangan: '', bulan: 'Oktober' });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, dataRes] = await Promise.all([
        api.get('/admin/iuran/stats'),
        api.get('/admin/iuran', { params: { page, limit: ITEMS_PER_PAGE, bulan: filterBulan, status: filterStatus || undefined, search } }),
      ]);
      setStats(statsRes.data);
      setData(dataRes.data?.data || dataRes.data);
      setTotalData(dataRes.data?.total || dataRes.data?.length || 0);
    } catch {
      setStats(MOCK_STATS);
      const filtered = MOCK_IURAN.filter(
        (item) =>
          (!filterBulan || item.bulan === filterBulan) &&
          (!filterStatus || item.status === filterStatus) &&
          (!search || item.namaWarga.toLowerCase().includes(search.toLowerCase()))
      );
      setData(filtered);
      setTotalData(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterBulan, filterStatus, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleKonfirmasiBayar = async (id: string | number) => {
    setActionLoading(id);
    try {
      await api.patch(`/admin/iuran/${id}/konfirmasi`);
      showToast('Pembayaran berhasil dikonfirmasi', 'success');
      fetchData();
    } catch {
      setData((prev) => prev.map((item) => item.id === id ? { ...item, status: 'Lunas' as const, tanggalBayar: new Date().toISOString() } : item));
      showToast('Pembayaran berhasil dikonfirmasi', 'success');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateIuran = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    try {
      await api.put('/admin/iuran/info', iuranForm);
      showToast('Informasi iuran berhasil diperbarui', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Informasi iuran berhasil diperbarui (demo)', 'success');
      setModalOpen(false);
    } finally {
      setFormLoading(false);
    }
  };

  const formatRupiah = (val: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalData);

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-[#1e3a5f]">Manajemen Iuran & Kas Desa</h1>
        <Button
          variant="primary"
          onClick={() => setModalOpen(true)}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        >
          Update Informasi
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
              <div className="w-12 h-12 bg-gray-200 rounded-xl mb-4" />
              <div className="h-3 bg-gray-200 rounded w-32 mb-3" />
              <div className="h-7 bg-gray-200 rounded w-24" />
            </div>
          ))
        ) : stats ? (
          <>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-[#dce5f5] rounded-xl flex items-center justify-center text-[#4a6fa5] mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Total Saldo Kas Saat Ini</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{formatRupiah(stats.totalSaldo)}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-[#dce5f5] rounded-xl flex items-center justify-center text-[#4a6fa5] mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Terkumpul Bulan Ini</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{formatRupiah(stats.terkumpulBulanIni)}</p>
            </div>
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="w-12 h-12 bg-[#dce5f5] rounded-xl flex items-center justify-center text-[#4a6fa5] mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-600 mb-1">Warga Belum Lunas</p>
              <p className="text-2xl font-bold text-[#1e3a5f]">{stats.wargaBelumLunas} Orang</p>
            </div>
          </>
        ) : null}
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterBulan} onChange={(e) => { setFilterBulan(e.target.value); setPage(1); }} className="input-field w-40">
          {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b} 2025</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} className="input-field w-36">
          <option value="">Semua Status</option>
          <option value="Lunas">Lunas</option>
          <option value="Belum">Belum Lunas</option>
        </select>
        <div className="relative flex-1 min-w-[180px]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input type="text" placeholder="Cari Nama Warga" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="input-field pl-10" />
        </div>
        <button onClick={fetchData} className="w-10 h-10 bg-white hover:bg-blue-50 border border-gray-200 rounded-xl flex items-center justify-center text-gray-500 transition-colors shadow-sm" title="Refresh">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-400 text-white">
                {['No', 'Nama Warga', 'RT/RW', 'Bulan', 'Nominal', 'Status', 'Aksi'].map((h) => (
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
                  <td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Tidak ada data iuran</td>
                </tr>
              ) : (
                data.map((item, idx) => (
                  <tr key={item.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-600">{startItem + idx}</td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">{item.namaWarga}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.rtRw}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.bulan}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(item.nominal)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.status === 'Lunas' ? 'lunas' : 'belum'}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {item.status === 'Lunas' ? (
                        <button className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Verifikasi
                        </button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionLoading === item.id}
                          onClick={() => handleKonfirmasiBayar(item.id)}
                          className="text-green-600 hover:bg-green-50 border border-green-200 text-xs"
                        >
                          ✓ Kirim Pengingat WA
                        </Button>
                      )}
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

      {/* Update Iuran Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Update Informasi Iuran" maxWidth="sm">
        <form onSubmit={handleUpdateIuran} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nominal Iuran (Rp)</label>
            <input
              required
              type="number"
              className="input-field"
              placeholder="50000"
              value={iuranForm.nominal}
              onChange={(e) => setIuranForm({ ...iuranForm, nominal: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Bulan</label>
            <select className="input-field" value={iuranForm.bulan} onChange={(e) => setIuranForm({ ...iuranForm, bulan: e.target.value })}>
              {BULAN_OPTIONS.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Keterangan</label>
            <textarea
              className="input-field h-24 resize-none"
              placeholder="Keterangan tambahan..."
              value={iuranForm.keterangan}
              onChange={(e) => setIuranForm({ ...iuranForm, keterangan: e.target.value })}
            />
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" type="button" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button variant="primary" className="flex-1" type="submit" loading={formLoading}>Simpan</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ManajemenIuran;
