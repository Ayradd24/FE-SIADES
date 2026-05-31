import React, { useCallback, useEffect, useState } from 'react';
import Badge from '../../components/ui/Badge';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { authStorage } from '../../lib/authStorage';

interface WargaDashboardStats {
  totalPengajuan: number;
  suratSelesai: number;
  recentSurat: Array<{
    id: number;
    jenis_surat: string;
    created_at: string;
    status: 'PENDING' | 'DISETUJUI' | 'DITOLAK';
  }>;
}

const DashboardWarga: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const userName = authStorage.getName() || 'Warga';
  const [stats, setStats] = useState<WargaDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const POLL_INTERVAL_MS = 15000;

  const fetchStats = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);

    try {
      const res = await api.get('/warga/dashboard/stats');
      setStats(res.data);
      setError(null);
    } catch {
      setError('Gagal memuat data real-time dashboard warga');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(true);

    const intervalId = window.setInterval(() => {
      fetchStats(false);
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [fetchStats]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const handleDownloadSurat = useCallback(async (suratId: number) => {
    try {
      const res = await api.get(`/surats/${suratId}/download`, { responseType: 'blob' });
      const contentTypeHeader = res.headers['content-type'];
      const contentType = typeof contentTypeHeader === 'string' ? contentTypeHeader : 'application/pdf';
      const blob = new Blob([res.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      const contentDisposition = res.headers['content-disposition'];
      let filename = `surat-${suratId}.pdf`;
      if (typeof contentDisposition === 'string') {
        const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
        const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
        const rawName = utf8Match?.[1] || asciiMatch?.[1];
        if (rawName) {
          filename = decodeURIComponent(rawName);
        }
      }
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Surat berhasil diunduh', 'success');
    } catch {
      showToast('Gagal mengunduh surat', 'error');
    }
  }, [showToast]);

  return (
    <>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Selamat Datang, {userName}!</h1>
        <p className="text-gray-500 mt-1">Ini adalah ringkasan aktivitas dan status layanan Anda di Desa Karangasem.</p>
      </div>

      {error && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Pengajuan Surat</p>
            <h3 className="text-3xl font-bold text-[#1e3a5f]">{loading || !stats ? '-' : stats.totalPengajuan}</h3>
          </div>
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Surat Disetujui</p>
            <h3 className="text-3xl font-bold text-green-600">{loading || !stats ? '-' : stats.suratSelesai}</h3>
          </div>
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f]">Pengajuan Surat Terbaru</h2>
            <Link to="/warga/pengajuan-surat" className="text-sm font-semibold text-blue-500 hover:text-blue-700">Lihat Semua</Link>
          </div>

          {loading ? (
            <div className="text-sm text-gray-500">Memuat data...</div>
          ) : !stats || stats.recentSurat.length === 0 ? (
            <div className="text-sm text-gray-500">Belum ada pengajuan surat.</div>
          ) : (
            <div className="space-y-4">
              {stats.recentSurat.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <div>
                    <h4 className="font-semibold text-[#1e3a5f]">{item.jenis_surat}</h4>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(item.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={item.status === 'DISETUJUI' ? 'approved' : item.status === 'DITOLAK' ? 'rejected' : 'pending'}>
                      {item.status === 'DISETUJUI' ? 'Disetujui' : item.status === 'DITOLAK' ? 'Ditolak' : 'Pending'}
                    </Badge>
                    {item.status === 'DISETUJUI' && (
                      <button
                        onClick={() => void handleDownloadSurat(item.id)}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                      >
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  );
};

export default DashboardWarga;
