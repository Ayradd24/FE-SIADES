import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';

interface DashboardStats {
  suratMenunggu: number;
  totalWarga: number;
  usahaAktif: number;
  totalKas: number;
}

interface PermohonanSurat {
  id: string | number;
  namaPemohon: string;
  jenisSurat: string;
  tanggal: string;
  status: 'PENDING' | 'DISETUJUI' | 'DITOLAK';
}

const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  path: string;
}> = ({ icon, label, value, path }) => {
  const navigate = useNavigate();
  return (
    <div
      className="bg-white rounded-2xl p-6 shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200 flex flex-col gap-4"
      onClick={() => navigate(path)}
    >
      <div className="w-16 h-16 bg-[#dce5f5] rounded-xl flex items-center justify-center text-[#4a6fa5]">
        {icon}
      </div>
      <div>
        <p className="text-sm text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-[#1e3a5f]">{value}</p>
      </div>
      <div className="flex justify-end">
        <button className="text-sm text-[#4a6fa5] bg-[#dce5f5] hover:bg-blue-200 px-4 py-1.5 rounded-full font-medium transition-colors">
          Detail →
        </button>
      </div>
    </div>
  );
};

const MailIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const PeopleIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);
const ShopIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const WalletIcon = () => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const statusBadge = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    DISETUJUI: 'bg-green-100 text-green-700',
    DITOLAK: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${map[status] || 'bg-gray-100 text-gray-600'}`}>
      {status}
    </span>
  );
};

const SkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 shadow-sm animate-pulse">
    <div className="w-16 h-16 bg-gray-200 rounded-xl mb-4" />
    <div className="h-3 bg-gray-200 rounded w-24 mb-2" />
    <div className="h-8 bg-gray-200 rounded w-16" />
  </div>
);

const Dashboard: React.FC = () => {
  const adminName = localStorage.getItem('siades_name') || 'Admin';
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentSurat, setRecentSurat] = useState<PermohonanSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [statsRes, suratRes] = await Promise.all([
          api.get('/admin/dashboard/stats'),
          api.get('/admin/persetujuan-surat?limit=5&status=PENDING'),
        ]);
        setStats(statsRes.data);
        setRecentSurat(suratRes.data?.data || suratRes.data || []);
      } catch {
        // Use mock data for development
        setStats({
          suratMenunggu: 5,
          totalWarga: 1250,
          usahaAktif: 42,
          totalKas: 15500000,
        });
        setRecentSurat([
          { id: 1, namaPemohon: 'Herman Sumanto', jenisSurat: 'Surat Domisili', tanggal: '2025-10-02', status: 'PENDING' },
          { id: 2, namaPemohon: 'Adit Santoso', jenisSurat: 'Pengantar SKCK', tanggal: '2025-10-07', status: 'PENDING' },
          { id: 3, namaPemohon: 'Denis Kurnia', jenisSurat: 'Pengantar SKCK', tanggal: '2025-10-08', status: 'PENDING' },
        ]);
        setError(null);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const formatRupiah = (value: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(value);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Greeting */}
      <h1 className="text-3xl font-extrabold text-[#1e3a5f] mb-8 leading-snug">
        Selamat Bertugas,<br />
        <span className="text-blue-500">{adminName}!</span>
      </h1>

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-700 text-sm">
          ⚠️ {error} — Menampilkan data contoh.
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : stats ? (
          <>
            <StatCard
              icon={<MailIcon />}
              label="Surat Menunggu"
              value={stats.suratMenunggu}
              path="/admin/persetujuan-surat"
            />
            <StatCard
              icon={<PeopleIcon />}
              label="Total Warga"
              value={stats.totalWarga.toLocaleString('id-ID')}
              path="/admin/data-warga"
            />
            <StatCard
              icon={<ShopIcon />}
              label="Usaha Aktif"
              value={stats.usahaAktif}
              path="/admin/manajemen-katalog"
            />
            <StatCard
              icon={<WalletIcon />}
              label="Iuran & Kas"
              value={formatRupiah(stats.totalKas)}
              path="/admin/manajemen-iuran"
            />
          </>
        ) : null}
      </div>

      {/* Recent Permohonan Surat */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-bold text-[#1e3a5f]">Permohonan Surat Terbaru</h2>
        </div>

        {loading ? (
          <div className="p-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 mb-3 animate-pulse">
                <div className="h-4 bg-gray-200 rounded flex-1" />
                <div className="h-4 bg-gray-200 rounded w-28" />
                <div className="h-4 bg-gray-200 rounded w-20" />
              </div>
            ))}
          </div>
        ) : recentSurat.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Belum ada permohonan surat</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-400 text-white">
                  <th className="text-left px-6 py-3 text-sm font-semibold">No</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Nama Pemohon</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Jenis Surat</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Tanggal</th>
                  <th className="text-left px-6 py-3 text-sm font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSurat.map((surat, idx) => (
                  <tr key={surat.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-3 text-sm text-gray-600">{idx + 1}</td>
                    <td className="px-6 py-3 text-sm font-medium text-gray-800">{surat.namaPemohon}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{surat.jenisSurat}</td>
                    <td className="px-6 py-3 text-sm text-gray-600">{formatDate(surat.tanggal)}</td>
                    <td className="px-6 py-3">{statusBadge(surat.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
