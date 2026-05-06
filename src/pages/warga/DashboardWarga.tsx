import React from 'react';
import Badge from '../../components/ui/Badge';
import { Link } from 'react-router-dom';

const DashboardWarga: React.FC = () => {
  const userName = localStorage.getItem('siades_name') || 'Warga';

  return (
    <div className="space-y-6">
      {/* Header Greeting */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Selamat Datang, {userName}!</h1>
        <p className="text-gray-500 mt-1">Ini adalah ringkasan aktivitas dan status layanan Anda di Desa Karangasem.</p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card Pengajuan Surat */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Pengajuan Surat</p>
            <h3 className="text-3xl font-bold text-[#1e3a5f]">3</h3>
          </div>
          <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        </div>

        {/* Card Surat Disetujui */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Surat Selesai</p>
            <h3 className="text-3xl font-bold text-green-600">2</h3>
          </div>
          <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>

        {/* Card Total Iuran */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50 flex items-center justify-between hover:shadow-md transition-shadow">
          <div>
            <p className="text-gray-500 text-sm font-medium mb-1">Total Iuran Terbayar</p>
            <h3 className="text-2xl font-bold text-[#1e3a5f]">Rp 150.000</h3>
          </div>
          <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center text-orange-600">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Aktivitas Pengajuan Terbaru */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f]">Pengajuan Surat Terbaru</h2>
            <Link to="/warga/pengajuan-surat" className="text-sm font-semibold text-blue-500 hover:text-blue-700">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {[
              { type: 'Surat Keterangan Usaha', date: '06 Mei 2026', status: 'Pending' },
              { type: 'Surat Keterangan Domisili', date: '01 Mei 2026', status: 'Disetujui' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h4 className="font-semibold text-[#1e3a5f]">{item.type}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.date}</p>
                </div>
                <Badge variant={item.status === 'Disetujui' ? 'approved' : 'pending'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Riwayat Iuran Terakhir */}
        <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-[#1e3a5f]">Riwayat Iuran Terakhir</h2>
            <Link to="/warga/iuran-saya" className="text-sm font-semibold text-blue-500 hover:text-blue-700">Lihat Semua</Link>
          </div>
          <div className="space-y-4">
            {[
              { type: 'Iuran Sampah Bulanan', date: '05 Mei 2026', amount: 'Rp 25.000', status: 'Lunas' },
              { type: 'Iuran Keamanan', date: '05 Mei 2026', amount: 'Rp 50.000', status: 'Menunggu Konfirmasi' },
            ].map((item, idx) => (
              <div key={idx} className="flex justify-between items-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <h4 className="font-semibold text-[#1e3a5f]">{item.type}</h4>
                  <p className="text-xs text-gray-500 mt-1">{item.date} • <span className="font-semibold">{item.amount}</span></p>
                </div>
                <Badge variant={item.status === 'Lunas' ? 'success' : 'warning'}>
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardWarga;
