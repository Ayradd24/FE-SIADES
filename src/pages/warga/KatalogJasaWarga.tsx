import React, { useCallback, useEffect, useMemo, useState } from 'react';
import api, { BASE_URL } from '../../lib/api';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import ToastContainer from '../../components/ui/Toast';

interface KatalogItem {
  id: number;
  nama_produk: string;
  deskripsi?: string;
  harga?: number;
  kontak_wa?: string;
  gambar?: string;
  status?: 'AKTIF' | 'NONAKTIF' | 'MENUNGGU';
  warga_status?: 'AKTIF' | 'NONAKTIF';
  effective_status?: 'AKTIF' | 'NONAKTIF' | 'MENUNGGU';
  user?: { id: number; name: string; no_telp?: string };
}

interface KatalogForm {
  nama_produk: string;
  deskripsi: string;
  harga: string;
  kontak_wa: string;
  gambar: File | null;
}

const initialForm: KatalogForm = {
  nama_produk: '',
  deskripsi: '',
  harga: '',
  kontak_wa: '',
  gambar: null,
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

const formatNumberId = (value: string) => {
  const numeric = Number(value || '0');
  return numeric.toLocaleString('id-ID');
};

const KatalogJasaWarga: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [items, setItems] = useState<KatalogItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [fetching, setFetching] = useState(true);
  const [form, setForm] = useState<KatalogForm>(initialForm);

  const storageBaseUrl = useMemo(() => BASE_URL.replace(/\/api$/, '') + '/storage/', []);

  const fetchKatalog = useCallback(async () => {
    setFetching(true);
    try {
      const res = await api.get('/warga/katalog');
      setItems(res.data?.data ?? []);
    } catch {
      showToast('Gagal mengambil data katalog jasa.', 'error');
    } finally {
      setFetching(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchKatalog();
  }, [fetchKatalog]);

  const handleGambarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) {
      setForm((prev) => ({ ...prev, gambar: null }));
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      showToast('Foto jasa harus berformat JPG atau PNG', 'error');
      setForm((prev) => ({ ...prev, gambar: null }));
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      showToast('Ukuran foto jasa maksimal 2 MB', 'error');
      setForm((prev) => ({ ...prev, gambar: null }));
      e.target.value = '';
      return;
    }

    setForm((prev) => ({ ...prev, gambar: file }));
  };

  const handleKontakWaChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (digitsOnly.length <= 13) {
      setForm((prev) => ({ ...prev, kontak_wa: digitsOnly }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      form.kontak_wa
      && (!form.kontak_wa.startsWith('08') || form.kontak_wa.length < 10 || form.kontak_wa.length > 13)
    ) {
      showToast('Kontak WhatsApp harus diawali 08 dan terdiri dari 10-13 digit', 'error');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('nama_produk', form.nama_produk.trim());
      formData.append('deskripsi', form.deskripsi.trim());

      if (form.harga.trim()) {
        formData.append('harga', form.harga.trim().replace(/[^0-9.]/g, ''));
      }

      if (form.kontak_wa.trim()) {
        formData.append('kontak_wa', form.kontak_wa.trim());
      }

      if (form.gambar) {
        formData.append('gambar', form.gambar);
      }

      await api.post('/warga/katalog', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      showToast('Pengajuan jasa berhasil dikirim dan menunggu persetujuan admin.', 'success');
      setIsModalOpen(false);
      setForm(initialForm);
      fetchKatalog();
    } catch (err: any) {
      const firstValidation = err?.response?.data?.errors
        ? Object.values(err.response.data.errors)[0]
        : null;
      const message = Array.isArray(firstValidation)
        ? firstValidation[0]
        : err?.response?.data?.message || 'Gagal mengirim pengajuan jasa.';
      showToast(String(message), 'error');
    } finally {
      setLoading(false);
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

  const updateWargaStatus = async (id: number, wargaStatus: 'AKTIF' | 'NONAKTIF') => {
    const target = items.find((item) => item.id === id);
    if (target && target.warga_status === wargaStatus) {
      return;
    }

    setStatusLoadingId(id);
    try {
      await api.patch(`/warga/katalog/${id}/status`, { warga_status: wargaStatus });
      showToast(`Status katalog Anda diubah ke ${wargaStatus}`, 'success');
      fetchKatalog();
    } catch {
      showToast('Gagal mengubah status katalog Anda.', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-blue-50">
        <div>
          <h1 className="text-2xl font-bold text-[#1e3a5f]">Katalog Jasa Warga</h1>
          <p className="text-gray-500 mt-1">Daftar jasa yang ditawarkan oleh warga Desa Karangasem.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>+ Ajukan Jasa Saya</Button>
      </div>

      {fetching ? (
        <div className="bg-white rounded-2xl p-6 text-gray-500">Memuat katalog...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-6 text-gray-500 text-center border border-blue-50">
              Belum ada katalog jasa.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-blue-50 p-5 hover:shadow-md transition-shadow flex flex-col">
                {item.gambar && (
                  <img
                    src={`${storageBaseUrl}${item.gambar}`}
                    alt={item.nama_produk}
                    className="w-full h-40 object-cover rounded-xl mb-4"
                  />
                )}

                <div className="flex justify-between items-start mb-3 gap-2">
                  <h3 className="font-bold text-[#1e3a5f] text-lg">{item.nama_produk}</h3>
                  <Badge
                    variant={item.effective_status === 'AKTIF' ? 'active' : item.effective_status === 'MENUNGGU' ? 'pending' : 'inactive'}
                  >
                    {item.effective_status || item.status || 'MENUNGGU'}
                  </Badge>
                </div>

                <p className="text-sm text-gray-500 mb-4 flex-1">{item.deskripsi || '-'}</p>

                <div className="pt-4 border-t border-gray-100 flex justify-between items-center gap-3">
                  <div>
                    <p className="text-xs text-gray-400">Pemilik</p>
                    <p className="font-semibold text-[#1e3a5f] text-sm">{item.user?.name || '-'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Harga</p>
                    <p className="font-bold text-blue-600">{formatRupiah(item.harga)}</p>
                  </div>
                </div>

                <a
                  className="mt-4"
                  href={item.kontak_wa ? `https://wa.me/${item.kontak_wa.replace(/[^0-9]/g, '')}` : '#'}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button className="w-full bg-green-500 hover:bg-green-600" disabled={!item.kontak_wa}>
                    Hubungi WA
                  </Button>
                </a>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={item.warga_status === 'AKTIF' ? 'primary' : 'outline'}
                    disabled={statusLoadingId === item.id || item.warga_status === 'AKTIF'}
                    onClick={() => updateWargaStatus(item.id, 'AKTIF')}
                  >
                    Aktif
                  </Button>
                  <Button
                    type="button"
                    variant={item.warga_status === 'NONAKTIF' ? 'primary' : 'outline'}
                    disabled={statusLoadingId === item.id || item.warga_status === 'NONAKTIF'}
                    onClick={() => updateWargaStatus(item.id, 'NONAKTIF')}
                  >
                    Nonaktif
                  </Button>
                </div>
                {item.status !== 'AKTIF' && (
                  <p className="mt-2 text-xs text-amber-600">
                    Status admin saat ini: {item.status}. Pengaturan warga tidak akan tampil publik sampai admin mengaktifkan.
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Pengajuan Jasa Baru">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Nama Jasa</label>
            <input
              type="text"
              required
              value={form.nama_produk}
              onChange={(e) => setForm((prev) => ({ ...prev, nama_produk: e.target.value }))}
              placeholder="Misal: Jasa Servis AC"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Deskripsi Singkat</label>
            <textarea
              required
              rows={3}
              value={form.deskripsi}
              onChange={(e) => setForm((prev) => ({ ...prev, deskripsi: e.target.value }))}
              placeholder="Jelaskan jasa yang ditawarkan..."
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Perkiraan Harga</label>
              <input
                required
                type="number"
                min="0"
                step="500"
                value={form.harga}
                onChange={(e) => setForm((prev) => ({ ...prev, harga: e.target.value.replace(/\D/g, '') }))}
                placeholder="50000"
                className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
              />
              <p className="text-xs text-gray-500 mt-1">
                Format rupiah: {form.harga ? `Rp ${formatNumberId(form.harga)}` : 'Rp 0'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Kontak WhatsApp</label>
              <input
                required
                type="text"
                value={form.kontak_wa}
                onChange={(e) => handleKontakWaChange(e.target.value)}
                placeholder="08xxxxxxxxxx"
                maxLength={13}
                className={`w-full px-4 py-2 border rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all ${form.kontak_wa && (!form.kontak_wa.startsWith('08') || form.kontak_wa.length < 10)
                    ? 'border-red-400'
                    : 'border-gray-300'
                  }`}
              />
              <p className={`text-xs mt-1 ${form.kontak_wa && (!form.kontak_wa.startsWith('08') || form.kontak_wa.length < 10)
                  ? 'text-red-500'
                  : 'text-gray-500'
                }`}>
                {form.kontak_wa && !form.kontak_wa.startsWith('08')
                  ? 'Nomor harus diawali 08'
                  : form.kontak_wa && form.kontak_wa.length < 10
                    ? 'Minimal 10 digit'
                    : 'Contoh: 081234567890'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Upload Foto Jasa (Opsional)</label>
            <input
              required
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              onChange={handleGambarChange}
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all cursor-pointer"
            />
            <p className="text-xs text-gray-500 mt-1">Format: JPG/PNG, maksimal 2 MB.</p>
            {form.gambar && <p className="text-xs text-green-600 mt-1 font-medium italic">File terpilih: {form.gambar.name}</p>}
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={loading}>{loading ? 'Mengirim...' : 'Kirim Pengajuan'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default KatalogJasaWarga;
