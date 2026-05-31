import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api, { BASE_URL } from "../lib/api";
import Modal from "../components/ui/Modal";

interface PublicKatalogItem {
  id: number;
  nama_produk: string;
  deskripsi?: string;
  harga?: number;
  kontak_wa?: string;
  gambar?: string;
  user?: { name?: string };
}

const ITEMS_PER_PAGE = 8;
const POLL_INTERVAL_MS = 15000;

export default function KatalogJasa() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<PublicKatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<PublicKatalogItem | null>(
    null,
  );
  const storageBaseUrl = useMemo(
    () => BASE_URL.replace(/\/api$/, "") + "/storage/",
    [],
  );

  const fetchKatalog = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const res = await api.get("/katalog");
      setItems((res.data?.data ?? []) as PublicKatalogItem[]);
    } catch {
      setItems([]);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKatalog(true);
    const intervalId = window.setInterval(() => {
      fetchKatalog(false);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchKatalog]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const formatRupiah = useMemo(
    () => (amount?: number) => {
      if (amount === undefined || amount === null)
        return "Harga belum dicantumkan";
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    },
    [],
  );

  const filtered = items.filter(
    (item) =>
      item.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_produk.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-[#e8edf5] font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-blue-400 hover:bg-blue-500 text-white
            px-5 py-1 rounded-full text-sm font-medium mb-8 transition-colors shadow"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Beranda
        </button>

        <h1 className="text-center text-2xl md:text-3xl font-extrabold text-blue-900 tracking-wide mb-8">
          KATALOG JASA & USAHA WARGA
        </h1>

        <div className="max-w-2xl mx-auto mb-10">
          <div className="relative">
            <svg
              className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Cari Jasa/Usaha"
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
                text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse"
              >
                <div className="h-32 bg-gray-200" />
                <div className="p-4">
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded mb-2" />
                  <div className="h-10 bg-gray-200 rounded mb-2" />
                  <div className="h-4 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : paged.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Tidak ditemukan jasa/usaha yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {paged.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                {item.gambar ? (
                  <img
                    src={`${storageBaseUrl}${item.gambar}`}
                    alt={item.nama_produk}
                    className="bg-blue-100 h-32 w-full object-cover"
                  />
                ) : (
                  <div className="bg-blue-100 h-32 flex items-center justify-center">
                    <span className="text-5xl">🛍️</span>
                  </div>
                )}

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-blue-800 text-sm">
                    {item.user?.name || "Warga"}
                  </h3>
                  <p className="font-semibold text-gray-800 text-sm">
                    {item.nama_produk}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex-1 line-clamp-2">
                    {item.deskripsi}
                  </p>

                  <div className="mt-3">
                    <span className="font-bold text-gray-800 text-sm">
                      {formatRupiah(item.harga)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!item.kontak_wa) return;
                      const phone = item.kontak_wa.replace(/[^0-9]/g, "");
                      window.open(`https://wa.me/${phone}`, "_blank");
                    }}
                    disabled={!item.kontak_wa}
                    className="mt-3 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold
                      px-4 py-2 rounded-lg transition-transform duration-150 active:scale-95 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Hubungi WA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pb-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className={`text-sm font-medium ${page <= 1 ? "text-gray-300 cursor-not-allowed" : "text-gray-500 hover:text-blue-600"}`}
          >
            &lt; Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${
                p === page
                  ? "bg-blue-500 text-white shadow"
                  : "text-gray-500 hover:bg-blue-100"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`text-sm font-medium ${
              page >= totalPages
                ? "text-gray-300 cursor-not-allowed"
                : "text-gray-800 hover:text-blue-600 font-bold"
            }`}
          >
            Next &gt;
          </button>
        </div>

        <Modal
          isOpen={selectedItem !== null}
          onClose={() => setSelectedItem(null)}
          title={selectedItem?.nama_produk || "Detail Katalog"}
          maxWidth="lg"
        >
          {selectedItem && (
            <div className="space-y-5">
              {/* Centered Image */}
              <div className="flex justify-center w-full">
                {selectedItem.gambar ? (
                  <img
                    src={`${storageBaseUrl}${selectedItem.gambar}`}
                    alt={selectedItem.nama_produk}
                    className="max-h-64 object-contain rounded-2xl shadow-sm border border-gray-100/50"
                  />
                ) : (
                  <div className="w-full h-48 rounded-2xl bg-blue-50/50 border border-blue-100 flex items-center justify-center">
                    <span className="text-5xl">🛍️</span>
                  </div>
                )}
              </div>

              {/* Grid 2 Columns */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Pemilik Jasa / Usaha */}
                <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                    PEMILIK JASA / USAHA
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <span className="font-extrabold text-[#475569] text-sm">
                      {selectedItem.user?.name || "Warga"}
                    </span>
                  </div>
                </div>

                {/* Estimasi Biaya / Harga */}
                <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
                  <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1.5">
                    ESTIMASI BIAYA / HARGA
                  </span>
                  <span className="font-extrabold text-[#4f46e5] text-base">
                    {formatRupiah(selectedItem.harga)}
                  </span>
                </div>
              </div>

              {/* Deskripsi Lengkap */}
              <div className="bg-[#f8fafc] border border-slate-100 rounded-2xl p-4 shadow-sm">
                <span className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-1.5 block">
                  DESKRIPSI LENGKAP
                </span>
                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {selectedItem.deskripsi || "-"}
                </p>
              </div>

              {/* Hubungi via WhatsApp Button (Aligned Right) */}
              <div className="flex justify-end pt-2 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedItem.kontak_wa) return;
                    const phone = selectedItem.kontak_wa.replace(/[^0-9]/g, "");
                    window.open(`https://wa.me/${phone}`, "_blank");
                  }}
                  disabled={!selectedItem.kontak_wa}
                  className="bg-[#10b981] hover:bg-[#059669] text-white text-xs sm:text-sm font-semibold
                    px-5 py-2.5 rounded-xl transition-all duration-150 active:scale-95 flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.45L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.858.002-2.634-1.023-5.11-2.884-6.974C16.59 1.888 14.113.865 11.48.865 6.046.865 1.623 5.286 1.62 10.723c-.001 1.64.499 3.238 1.448 4.826l-.997 3.64 3.73-.978l.006-.003zM16.89 13.91c-.266-.134-1.579-.78-1.821-.867-.243-.088-.419-.133-.596.134-.176.265-.685.867-.839 1.043-.155.177-.308.2-.574.067-.266-.134-1.127-.415-2.147-1.328-.794-.708-1.329-1.582-1.485-1.848-.156-.266-.017-.41.117-.543.12-.12.266-.31.4-.464.133-.155.177-.265.266-.443.089-.177.044-.332-.022-.464-.067-.133-.596-1.437-.817-1.968-.215-.518-.452-.447-.62-.456-.16-.008-.343-.01-.527-.01-.184 0-.487.07-.742.349-.256.279-.976.955-.976 2.331s1.002 2.709 1.14 2.898c.14.189 1.973 3.012 4.778 4.22.668.288 1.189.46 1.597.59.67.213 1.28.183 1.761.11.536-.081 1.58-.646 1.801-1.239.222-.593.222-1.101.155-1.207-.066-.107-.243-.176-.509-.31z" />
                  </svg>
                  Hubungi via WhatsApp
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
