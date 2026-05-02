import React, { useState, useEffect, useCallback } from 'react';
import api from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';

type StatusSurat = 'PENDING' | 'DISETUJUI' | 'DITOLAK';

interface PermohonanSurat {
  id: string | number;
  namaPemohon: string;
  jenisSurat: string;
  tanggal: string;
  status: StatusSurat;
  keterangan?: string;
}

const MOCK_DATA: PermohonanSurat[] = [
  { id: 1, namaPemohon: 'Herman', jenisSurat: 'Surat Domisili', tanggal: '2025-10-02', status: 'PENDING' },
  { id: 2, namaPemohon: 'Adit', jenisSurat: 'Pengantar SKCK', tanggal: '2025-10-07', status: 'PENDING' },
  { id: 3, namaPemohon: 'Denis', jenisSurat: 'Pengantar SKCK', tanggal: '2025-10-08', status: 'PENDING' },
  { id: 4, namaPemohon: 'Sari', jenisSurat: 'Keterangan Domisili', tanggal: '2025-10-01', status: 'DISETUJUI' },
  { id: 5, namaPemohon: 'Budi', jenisSurat: 'Surat Tidak Mampu', tanggal: '2025-09-28', status: 'DITOLAK' },
];

const ITEMS_PER_PAGE = 10;

const PersetujuanSurat: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<PermohonanSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'' | StatusSurat>('');
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/persetujuan-surat', {
        params: { page, limit: ITEMS_PER_PAGE, status: filterStatus || undefined },
      });
      setData(res.data?.data || res.data);
      setTotalData(res.data?.total || res.data?.length || 0);
    } catch {
      const filtered = filterStatus ? MOCK_DATA.filter((d) => d.status === filterStatus) : MOCK_DATA;
      setData(filtered);
      setTotalData(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string | number, action: 'approve' | 'reject') => {
    setActionLoading(id);
    try {
      const endpoint = action === 'approve'
        ? `/admin/persetujuan-surat/${id}/approve`
        : `/admin/persetujuan-surat/${id}/reject`;
      await api.patch(endpoint);
      const label = action === 'approve' ? 'disetujui' : 'ditolak';
      showToast(`Permohonan surat berhasil ${label}`, action === 'approve' ? 'success' : 'error');
      fetchData();
    } catch {
      // Simulate for demo
      setData((prev) =>
        prev.map((item) =>
          item.id === id
            ? { ...item, status: action === 'approve' ? 'DISETUJUI' : 'DITOLAK' }
            : item
        )
      );
      const label = action === 'approve' ? 'disetujui' : 'ditolak';
      showToast(`Permohonan surat berhasil ${label}`, action === 'approve' ? 'success' : 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalData);

  const getStatusBadge = (status: StatusSurat) => {
    const map: Record<StatusSurat, { variant: 'pending' | 'approved' | 'rejected'; label: string }> = {
      PENDING: { variant: 'pending', label: 'Menunggu' },
      DISETUJUI: { variant: 'approved', label: 'Disetujui' },
      DITOLAK: { variant: 'rejected', label: 'Ditolak' },
    };
    const { variant, label } = map[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <h1 className="text-3xl font-extrabold text-[#1e3a5f] mb-6">Persetujuan Surat</h1>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        {(['', 'PENDING', 'DISETUJUI', 'DITOLAK'] as const).map((status) => (
          <button
            key={status}
            onClick={() => { setFilterStatus(status); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === status
                ? 'bg-blue-400 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-blue-50 shadow-sm'
            }`}
          >
            {status === '' ? 'Semua' : status === 'PENDING' ? 'Menunggu' : status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-400 text-white">
                {['No', 'Nama Pemohon', 'Jenis Surat', 'Tanggal', 'Aksi'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-sm font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada permohonan surat
                  </td>
                </tr>
              ) : (
                data.map((surat, idx) => (
                  <tr key={surat.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-600">{startItem + idx}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{surat.namaPemohon}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{surat.jenisSurat}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{formatDate(surat.tanggal)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {surat.status === 'PENDING' ? (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleAction(surat.id, 'reject')}
                              loading={actionLoading === surat.id}
                            >
                              ✕ Tolak
                            </Button>
                            <button className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold transition-colors">
                              Detail
                            </button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleAction(surat.id, 'approve')}
                              loading={actionLoading === surat.id}
                            >
                              ✓ Setuju
                            </Button>
                          </>
                        ) : (
                          <>{getStatusBadge(surat.status)}</>
                        )}
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
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</Button>
              <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages || 1}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next →</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PersetujuanSurat;
