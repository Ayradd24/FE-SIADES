import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';

const dummyIuran = [
  { id: 1, bulan: 'Mei 2026', jenis: 'Iuran Kebersihan & Keamanan', nominal: 'Rp 50.000', status: 'Belum Bayar' },
  { id: 2, bulan: 'April 2026', jenis: 'Iuran Kebersihan & Keamanan', nominal: 'Rp 50.000', status: 'Menunggu Konfirmasi' },
  { id: 3, bulan: 'Maret 2026', jenis: 'Iuran Kebersihan & Keamanan', nominal: 'Rp 50.000', status: 'Lunas' },
];

const IuranSaya: React.FC = () => {
  const { showToast } = useToast();
  const [selectedIuran, setSelectedIuran] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSelectedIuran(null);
      showToast('Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.', 'success');
    }, 1500);
  };

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
                <th className="p-4 text-sm font-semibold text-[#1e3a5f] text-center">Aksi</th>
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
                  <td className="p-4 text-center">
                    {item.status === 'Belum Bayar' && (
                      <Button size="sm" onClick={() => setSelectedIuran(item.id)}>Bayar</Button>
                    )}
                    {item.status === 'Menunggu Konfirmasi' && (
                      <span className="text-xs text-gray-400 italic">Menunggu verifikasi admin</span>
                    )}
                    {item.status === 'Lunas' && (
                      <span className="text-xs text-green-500 font-semibold">Selesai</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Upload Bukti */}
      <Modal isOpen={!!selectedIuran} onClose={() => setSelectedIuran(null)} title="Upload Bukti Pembayaran">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-4">
            <p className="text-sm text-[#1e3a5f] font-semibold">Informasi Transfer:</p>
            <p className="text-xs text-gray-600 mt-1">Bank BRI: <strong>1234-5678-9012</strong> a.n Desa Karangasem</p>
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Upload Foto Bukti Transfer</label>
            <input 
              type="file" 
              accept="image/*"
              required
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all cursor-pointer border border-gray-300 rounded-xl p-1"
            />
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setSelectedIuran(null)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Mengunggah...' : 'Kirim Bukti'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default IuranSaya;
