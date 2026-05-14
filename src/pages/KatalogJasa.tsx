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
  const [selectedItem, setSelectedItem] = useState<PublicKatalogItem | null>(null);
  const storageBaseUrl = useMemo(() => BASE_URL.replace(/\/api$/, "") + "/storage/", []);

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
      if (amount === undefined || amount === null) return "Harga belum dicantumkan";
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount);
    },
    []
  );

  const filtered = items.filter(
    (item) =>
      item.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      item.nama_produk.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#e8edf5] font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1.5 bg-blue-400 hover:bg-blue-500 text-white
            px-5 py-1 rounded-full text-sm font-medium mb-8 transition-colors shadow"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Home
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
              <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
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
                  <h3 className="font-bold text-blue-800 text-sm">{item.user?.name || "Warga"}</h3>
                  <p className="font-semibold text-gray-800 text-sm">{item.nama_produk}</p>
                  <p className="text-xs text-gray-500 mt-1 flex-1 line-clamp-2">{item.deskripsi}</p>

                  <div className="mt-3">
                    <span className="font-bold text-gray-800 text-sm">{formatRupiah(item.harga)}</span>
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
                p === page ? "bg-blue-500 text-white shadow" : "text-gray-500 hover:bg-blue-100"
              }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`text-sm font-medium ${
              page >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-800 hover:text-blue-600 font-bold"
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
            <div className="space-y-4">
              {selectedItem.gambar ? (
                <img
                  src={`${storageBaseUrl}${selectedItem.gambar}`}
                  alt={selectedItem.nama_produk}
                  className="w-full h-60 object-cover rounded-xl"
                />
              ) : (
                <div className="h-60 rounded-xl bg-blue-100 flex items-center justify-center">
                  <span className="text-6xl">🛍️</span>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Pemilik Jasa</p>
                <p className="font-semibold text-[#1e3a5f]">{selectedItem.user?.name || "Warga"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Deskripsi</p>
                <p className="text-sm text-gray-700 whitespace-pre-line">{selectedItem.deskripsi || "-"}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm text-gray-500">Harga</p>
                <p className="text-lg font-bold text-[#1e3a5f]">{formatRupiah(selectedItem.harga)}</p>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!selectedItem.kontak_wa) return;
                    const phone = selectedItem.kontak_wa.replace(/[^0-9]/g, "");
                    window.open(`https://wa.me/${phone}`, "_blank");
                  }}
                  disabled={!selectedItem.kontak_wa}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold
                    px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Hubungi WA
                </button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
