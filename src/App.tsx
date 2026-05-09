import { Routes, Route, Navigate, Link } from "react-router-dom";
import logo from "./assets/logo-desa.png";
import bg from "./assets/sawah-bg.png";
import LoginAdmin from "./pages/admin/LoginAdmin";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/admin/Dashboard";
import DataWarga from "./pages/admin/DataWarga";
import PersetujuanSurat from "./pages/admin/PersetujuanSurat";
import ManajemenKatalog from "./pages/admin/ManajemenKatalog";
import ManajemenIuran from "./pages/admin/ManajemenIuran";
import ManajemenPerangkat from "./pages/admin/ManajemenPerangkat";
import StrukturDesa from "./pages/StrukturDesa";
import KatalogJasa from "./pages/KatalogJasa";
import AdminLayout from "./components/layout/AdminLayout";
import AdminRoutes from "./router/AdminRoutes";

// Import Warga
import WargaRoutes from "./router/WargaRoutes";
import WargaLayout from "./components/layout/WargaLayout";
import DashboardWarga from "./pages/warga/DashboardWarga";
import PengajuanSurat from "./pages/warga/PengajuanSurat";
import KatalogJasaWarga from "./pages/warga/KatalogJasaWarga";
import IuranSaya from "./pages/warga/IuranSaya";
import ProfilSaya from "./pages/warga/ProfilSaya";

// Import AuthProvider for token validation
import AuthProvider from "./components/AuthProvider";

const previewJasa = [
  {
    nama: "Bambang",
    jasa: "Servis Listrik/Elektronik",
    deskripsi: "Layanan servis listrik dan elektronik terpercaya...",
    harga: "Rp 30.000",
    satuan: "/Barang",
    color: "bg-blue-100",
    icon: "🔧",
  },
  {
    nama: "Warni",
    jasa: "Salon & Kecantikan",
    deskripsi: "Potong rambut, creambath, smoothing, dan perawatan wajah...",
    harga: "Rp 15.000",
    color: "bg-pink-100",
    icon: "💇",
  },
  {
    nama: "Fauzi",
    jasa: "Fotografer",
    deskripsi: "Jasa foto pernikahan, wisuda, produk, dan dokumentasi acara...",
    harga: "Rp 300.000",
    satuan: "/acara",
    color: "bg-violet-100",
    icon: "📷",
  },
  {
    nama: "Dian",
    jasa: "Laundry",
    deskripsi:
      "Cuci setrika ekspres, satuan, dan kiloan. Tersedia layanan jemput...",
    harga: "Rp 6.000",
    satuan: "/Kg",
    color: "bg-teal-100",
    icon: "🧺",
  },
  {
    nama: "Heru",
    jasa: "Tukang Bangunan",
    deskripsi: "Jasa renovasi rumah, pasang keramik, dan pengecatan dinding...",
    harga: "Rp 150.000",
    satuan: "/hari",
    color: "bg-orange-100",
    icon: "🏗️",
  },
];

function LandingPage() {
  return (
    <div className="font-sans">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <div className="flex items-center gap-3">
          <img src={logo} className="w-10 h-10" alt="Logo Desa" />
          <span className="font-semibold text-blue-800">Desa Karangasem</span>
        </div>
        <a href="/login">
          <button className="bg-blue-400 text-white px-5 py-1 rounded-full hover:bg-blue-500 transition-colors">
            Masuk
          </button>
        </a>
      </div>

      {/* HERO */}
      <div
        className="relative h-[400px] flex items-center justify-center text-white"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        <div className="absolute inset-0 bg-blue-900/50" />
        <div className="relative text-center px-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">
            Selamat Datang di Portal Desa Karangasem
          </h1>
          <p className="mb-4 text-sm">
            Mewujudkan desa yang transparan, inovatif, dan mandiri
          </p>
          <button
            onClick={() =>
              document
                .getElementById("katalog-jasa")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="bg-blue-400 px-6 py-2 rounded-full hover:bg-blue-500 transition-colors"
          >
            LIHAT E-KATALOG JASA WARGA
          </button>
        </div>
      </div>

      {/* STRUKTUR */}
      <div className="py-12 text-center bg-gray-100">
        <h2 className="text-xl font-bold text-blue-800 mb-8">
          STRUKTUR PEMERINTAH DESA
        </h2>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { nama: "Ronaldo", jabatan: "Sekretaris Desa" },
            { nama: "Ahmad", jabatan: "Kepala Desa" },
            { nama: "Messi", jabatan: "Bendahara Desa" },
          ].map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-xl w-52 shadow">
              <div className="w-16 h-16 bg-blue-200 mx-auto rounded-full mb-2" />
              <h3 className="font-semibold">{item.nama}</h3>
              <p className="text-sm text-green-600">{item.jabatan}</p>
            </div>
          ))}
        </div>
        <Link to="/struktur-desa">
          <button className="mt-6 bg-blue-400 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-colors">
            LIHAT SELENGKAPNYA
          </button>
        </Link>
      </div>

      {/* KATALOG */}
      <div id="katalog-jasa" className="py-12 bg-[#e8edf5]">
        <h2 className="text-xl font-bold text-blue-800 mb-8 text-center">
          KATALOG JASA WARGA
        </h2>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {previewJasa.map((item, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                <div
                  className={`${item.color} h-28 flex items-center justify-center`}
                >
                  <span className="text-4xl">{item.icon}</span>
                </div>
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-blue-800 text-xs">
                    {item.nama}
                  </h3>
                  <p className="font-semibold text-gray-800 text-xs">
                    {item.jasa}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex-1 line-clamp-2">
                    {item.deskripsi}
                  </p>
                  <div className="mt-2">
                    <span className="font-bold text-gray-800 text-xs">
                      {item.harga}
                    </span>
                    {item.satuan && (
                      <span className="text-gray-400 text-xs">
                        {item.satuan}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="mt-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold
                      px-3 py-1.5 rounded-lg transition-transform duration-150 active:scale-95 w-fit"
                  >
                    Hubungi WA
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link to="/katalog-jasa">
              <button className="bg-blue-400 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-colors">
                LIHAT SELENGKAPNYA
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-700 text-white text-center py-4">
        © 2026 Desa Karangasem
      </div>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginAdmin />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/struktur-desa" element={<StrukturDesa />} />
      <Route path="/katalog-jasa" element={<KatalogJasa />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      <Route element={<AdminRoutes />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/data-warga" element={<DataWarga />} />
          <Route
            path="/admin/persetujuan-surat"
            element={<PersetujuanSurat />}
          />
          <Route
            path="/admin/manajemen-katalog"
            element={<ManajemenKatalog />}
          />
          <Route path="/admin/manajemen-iuran" element={<ManajemenIuran />} />
          <Route path="/admin/manajemen-perangkat" element={<ManajemenPerangkat />} />
          <Route path="/admin/struktur-desa" element={<StrukturDesa />} />
        </Route>
      </Route>

      <Route element={<WargaRoutes />}>
        <Route element={<WargaLayout />}>
          <Route path="/warga/dashboard" element={<DashboardWarga />} />
          <Route path="/warga/pengajuan-surat" element={<PengajuanSurat />} />
          <Route path="/warga/katalog-jasa" element={<KatalogJasaWarga />} />
          <Route path="/warga/iuran-saya" element={<IuranSaya />} />
          <Route path="/warga/profil" element={<ProfilSaya />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
