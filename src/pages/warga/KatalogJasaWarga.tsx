import React, { useState } from 'react';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';

const dummyKatalog = [
  { id: 1, nama: 'Bambang', jasa: 'Servis Listrik/Elektronik', deskripsi: 'Layanan servis listrik dan elektronik terpercaya.', harga: 'Rp 30.000', satuan: '/Barang', status: 'Aktif' },
  { id: 2, nama: 'Warni', jasa: 'Salon & Kecantikan', deskripsi: 'Potong rambut, creambath, dll.', harga: 'Rp 15.000', satuan: '', status: 'Aktif' },
];

const KatalogJasaWarga: React.FC = () => {
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setIsModalOpen(false);
      showToast('Pengajuan jasa berhasil dikirim dan menunggu persetujuan admin.', 'success');
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Katalog Jasa Warga</h1>
          <p className="text-gray-500 mt-1">Daftar jasa yang ditawarkan oleh warga Desa Karangasem.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Ajukan Jasa Saya</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {dummyKatalog.map((item) => (
          <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 p-5 hover:shadow-md transition-shadow flex flex-col">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-[#1e3a5f] text-lg">{item.jasa}</h3>
              <Badge variant="active">{item.status}</Badge>
            </div>
            <p className="text-sm text-gray-500 mb-4 flex-1">{item.deskripsi}</p>
            <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-400">Pemilik</p>
                <p className="font-semibold text-[#1e3a5f] text-sm">{item.nama}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Harga</p>
                <p className="font-bold text-blue-600">{item.harga} <span className="text-xs font-normal text-gray-500">{item.satuan}</span></p>
              </div>
            </div>
            <Button className="w-full mt-4 bg-green-500 hover:bg-green-600">Hubungi WA</Button>
          </div>
        ))}
      </div>

      {/* Modal Pengajuan Jasa */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengajuan Jasa Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Nama Jasa</label>
            <input type="text" required placeholder="Misal: Jasa Servis AC" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Nama Pemilik</label>
            <input type="text" required placeholder="Masukan Nama Pemilik" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Deskripsi Singkat</label>
            <textarea required rows={3} placeholder="Jelaskan jasa yang ditawarkan..." className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none"></textarea>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Perkiraan Harga</label>
              <input type="text" required placeholder="Rp 50.000" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-1">Satuan</label>
              <input type="text" placeholder="/ Jam" className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Ajukan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KatalogJasaWarga;
