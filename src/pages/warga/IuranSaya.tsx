import React from 'react';
import Badge from '../../components/ui/Badge';

const dummyIuran = [
  { id: 1, bulan: 'Mei 2026', jenis: 'Iuran Wajib', nominal: 'Rp 50.000', status: 'Belum Bayar' },
  { id: 2, bulan: 'April 2026', jenis: 'Iuran Wajib', nominal: 'Rp 50.000', status: 'Lunas' },
  { id: 3, bulan: 'Maret 2026', jenis: 'Iuran Wajib', nominal: 'Rp 50.000', status: 'Lunas' },
];

const IuranSaya: React.FC = () => {

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
        <h1 className="text-2xl font-bold text-[#1e3a5f]">Iuran Saya</h1>
        <p className="text-gray-500 mt-1">Kelola dan bayar iuran bulanan desa Anda di sini.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-blue-50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-blue-50/50 border-b border-blue-100">
                <th className="p-4 text-sm font-semibold text-[#1e3a5f]">Bulan</th>
                <th className="p-4 text-sm font-semibold text-[#1e3a5f]">Jenis Iuran</th>
                <th className="p-4 text-sm font-semibold text-[#1e3a5f]">Nominal</th>
                <th className="p-4 text-sm font-semibold text-[#1e3a5f]">Status</th>

              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {dummyIuran.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm text-gray-700">{item.bulan}</td>
                  <td className="p-4 text-sm text-gray-700">{item.jenis}</td>
                  <td className="p-4 text-sm font-semibold text-gray-800">{item.nominal}</td>
                  <td className="p-4">
                    <Badge variant={item.status === 'Lunas' ? 'lunas' : item.status === 'Belum Bayar' ? 'belum' : 'pending'}>
                      {item.status}
                    </Badge>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


    </div>
  );
};

export default IuranSaya;
