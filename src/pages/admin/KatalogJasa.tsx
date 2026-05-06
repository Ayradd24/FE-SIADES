import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface JasaItem {
  id: number;
  nama: string;
  jasa: string;
  deskripsi: string;
  harga: string;
  satuan?: string;
  color: string;
  icon: string;
}

const allJasa: JasaItem[] = [
  {
    id: 1,
    nama: "Bambang",
    jasa: "Servis Listrik/Elektronik",
    deskripsi: "Layanan servis listrik dan elektronik terpercaya dengan...",
    harga: "Rp 30.000",
    satuan: "/Barang",
    color: "bg-blue-100",
    icon: "🔧",
  },
  {
    id: 2,
    nama: "Endang",
    jasa: "Catering Nasi Box",
    deskripsi: "Menu rumahan lezat untuk berbagai acara. Sehat, bersih, dan halal.",
    harga: "Rp 25.000",
    satuan: "/porsi",
    color: "bg-green-100",
    icon: "🍴",
  },
  {
    id: 3,
    nama: "Bejon",
    jasa: "Kerajinan Kayu",
    deskripsi: "Pembuatan mebel custom, ukiran hiasan dinding, dan perbaikan...",
    harga: "Rp 250.000",
    color: "bg-amber-100",
    icon: "🔨",
  },
  {
    id: 4,
    nama: "Siti",
    jasa: "Jasa Jahit",
    deskripsi: "Pembuatan seragam, permak pakaian dengan jahitan rapi...",
    harga: "Rp 20.000",
    color: "bg-cyan-100",
    icon: "👗",
  },
  {
    id: 5,
    nama: "Dian",
    jasa: "Laundry",
    deskripsi: "Cuci setrika ekspres, satuan, dan kiloan. Tersedia layanan jemput...",
    harga: "Rp 6.000",
    satuan: "/Kg",
    color: "bg-teal-100",
    icon: "🧺",
  },
  {
    id: 6,
    nama: "Roni",
    jasa: "Cuci Motor/Mobil",
    deskripsi: "Layanan cuci motor/mobil dengan mesin kecepatan tinggi...",
    harga: "Rp 15.000",
    color: "bg-cyan-200",
    icon: "🚗",
  },
  {
    id: 7,
    nama: "Bejo",
    jasa: "Bengkel Motor/Mobil",
    deskripsi: "Servis rutin, ganti oli, dan perbaikan mesin motor & mobil...",
    harga: "Rp 50.000",
    color: "bg-blue-50",
    icon: "🏍️",
  },
  {
    id: 8,
    nama: "Edi",
    jasa: "Cetak Spanduk",
    deskripsi: "Jasa Cetak Spanduk dengan kualitas tinggi",
    harga: "Rp 25.000",
    satuan: "/meter",
    color: "bg-orange-50",
    icon: "🖨️",
  },
  {
    id: 9,
    nama: "Warni",
    jasa: "Salon & Kecantikan",
    deskripsi: "Potong rambut, creambath, smoothing, dan perawatan wajah...",
    harga: "Rp 15.000",
    color: "bg-pink-100",
    icon: "💇",
  },
  {
    id: 10,
    nama: "Heru",
    jasa: "Tukang Bangunan",
    deskripsi: "Jasa renovasi rumah, pasang keramik, dan pengecatan dinding...",
    harga: "Rp 150.000",
    satuan: "/hari",
    color: "bg-orange-100",
    icon: "🏗️",
  },
  {
    id: 11,
    nama: "Tini",
    jasa: "Jual Sembako",
    deskripsi: "Menjual berbagai kebutuhan pokok harian dengan harga terjangkau...",
    harga: "Rp 5.000",
    color: "bg-yellow-100",
    icon: "🛒",
  },
  {
    id: 12,
    nama: "Pak Gimin",
    jasa: "Jasa Angkut/Pick Up",
    deskripsi: "Layanan angkut barang pindahan, material bangunan, dan hasil panen...",
    harga: "Rp 100.000",
    satuan: "/trip",
    color: "bg-gray-100",
    icon: "🚛",
  },
  {
    id: 13,
    nama: "Yuli",
    jasa: "Les Privat",
    deskripsi: "Les privat SD–SMP semua mata pelajaran, sabar dan berpengalaman...",
    harga: "Rp 50.000",
    satuan: "/sesi",
    color: "bg-indigo-100",
    icon: "📚",
  },
  {
    id: 14,
    nama: "Pak Narto",
    jasa: "Jasa Las",
    deskripsi: "Las listrik dan karbit untuk pagar, teralis, kanopi, dan tralis...",
    harga: "Rp 80.000",
    color: "bg-red-100",
    icon: "⚙️",
  },
  {
    id: 15,
    nama: "Mbak Rina",
    jasa: "Catering Snack",
    deskripsi: "Aneka kue dan snack untuk arisan, rapat, dan acara keluarga...",
    harga: "Rp 3.000",
    satuan: "/pcs",
    color: "bg-rose-100",
    icon: "🍰",
  },
  {
    id: 16,
    nama: "Fauzi",
    jasa: "Fotografer",
    deskripsi: "Jasa foto pernikahan, wisuda, produk, dan dokumentasi acara...",
    harga: "Rp 300.000",
    satuan: "/acara",
    color: "bg-violet-100",
    icon: "📷",
  },
];

const ITEMS_PER_PAGE = 8;

export default function KatalogJasa() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  const filtered = allJasa.filter(
    (item) =>
      item.nama.toLowerCase().includes(search.toLowerCase()) ||
      item.jasa.toLowerCase().includes(search.toLowerCase()),
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paged = filtered.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-screen bg-[#e8edf5] font-sans">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Back button */}
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

        {/* Title */}
        <h1 className="text-center text-2xl md:text-3xl font-extrabold text-blue-900 tracking-wide mb-8">
          KATALOG JASA & USAHA WARGA
        </h1>

        {/* Search bar */}
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
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 bg-white shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent
                text-gray-700 placeholder-gray-400 text-sm"
            />
          </div>
        </div>

        {/* Cards grid */}
        {paged.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg">Tidak ditemukan jasa/usaha yang cocok.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {paged.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                <div className={`${item.color} h-32 flex items-center justify-center`}>
                  <span className="text-5xl">{item.icon}</span>
                </div>

                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-blue-800 text-sm">{item.nama}</h3>
                  <p className="font-semibold text-gray-800 text-sm">{item.jasa}</p>
                  <p className="text-xs text-gray-500 mt-1 flex-1 line-clamp-2">{item.deskripsi}</p>

                  <div className="mt-3">
                    <p className="text-sm">
                      {!item.satuan && <span className="text-gray-400 text-xs">Mulai </span>}
                      <span className="font-bold text-gray-800">{item.harga}</span>
                      {item.satuan && <span className="text-gray-400 text-xs">{item.satuan}</span>}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => { }}
                    className="mt-3 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold
                      px-4 py-2 rounded-lg transition-transform duration-150 active:scale-95 w-fit"
                  >
                    Hubungi WA
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
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
              className={`w-8 h-8 rounded-lg text-sm font-bold transition-colors ${p === page ? "bg-blue-500 text-white shadow" : "text-gray-500 hover:bg-blue-100"
                }`}
            >
              {p}
            </button>
          ))}

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className={`text-sm font-medium ${page >= totalPages ? "text-gray-300 cursor-not-allowed" : "text-gray-800 hover:text-blue-600 font-bold"
              }`}
          >
            Next &gt;
          </button>
        </div>
      </div>
    </div>
  );
}