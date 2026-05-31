import { useCallback, useEffect, useMemo, useState } from "react";
import { Routes, Route, Navigate, Link } from "react-router-dom";
import logo from "./assets/logo-desa.png";
import bg from "./assets/sawah-bg.png";
import api, { BASE_URL } from "./lib/api";
import { authStorage } from "./lib/authStorage";
import LoginAdmin from "./pages/admin/LoginAdmin";
import LupaPassword from "./pages/LupaPassword";
import VerifikasiOTP from "./pages/VerifikasiOTP";
import GantiPassword from "./pages/GantiPassword";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/admin/Dashboard";
import DataWarga from "./pages/admin/DataWarga";
import PersetujuanSurat from "./pages/admin/PersetujuanSurat";
import ManajemenKatalog from "./pages/admin/ManajemenKatalog";
import ManajemenPerangkat from "./pages/admin/ManajemenPerangkat";
import ManajemenStrukturDesa from "./pages/admin/ManajemenStrukturDesa";
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
import ProfilSaya from "./pages/warga/ProfilSaya";
import SetupAkunWarga from "./pages/warga/SetupAkunWarga";

// Import AuthProvider for token validation
import AuthProvider from "./components/AuthProvider";

interface PublicKatalogItem {
  id: number;
  nama_produk: string;
  deskripsi?: string;
  harga?: number;
  kontak_wa?: string;
  gambar?: string;
  user?: { name?: string };
}

interface StrukturPreviewItem {
  id: number;
  nama: string;
  jabatan: string;
  foto: string | null;
}

function StrukturPreview() {
  const [items, setItems] = useState<StrukturPreviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const storageBase = useMemo(() => BASE_URL.replace(/\/api$/, '') + '/storage/', []);
  const getPreviewColumnClass = (jabatan: string) => {
    const lower = jabatan.toLowerCase();
    if (lower === 'kepala desa') return 'sm:col-start-2';
    if (lower === 'bendahara desa') return 'sm:col-start-3';
    return 'sm:col-start-1';
  };

  useEffect(() => {
    api.get('/struktur-desa')
      .then((res) => {
        const all = (res.data?.data ?? res.data ?? []) as StrukturPreviewItem[];
        // Show Sekretaris left, Kepala Desa center, Bendahara right.
        const order: Record<string, number> = {
          'sekretaris desa': 0,
          'kepala desa': 1,
          'bendahara desa': 2,
        };
        const top = all
          .filter((o) => ['kepala desa', 'sekretaris desa', 'bendahara desa'].includes(o.jabatan.toLowerCase()))
          .sort((a, b) => (order[a.jabatan.toLowerCase()] ?? 99) - (order[b.jabatan.toLowerCase()] ?? 99))
          .slice(0, 3);
        setItems(top);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="py-12 text-center bg-gray-100">
      <h2 className="text-xl font-bold text-blue-800 mb-8">
        STRUKTUR PEMERINTAH DESA
      </h2>
      <div className="mx-auto grid max-w-4xl grid-cols-1 justify-items-center gap-6 sm:grid-cols-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white p-5 rounded-xl w-52 shadow animate-pulse">
              <div className="w-16 h-16 bg-gray-200 mx-auto rounded-full mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto mb-2" />
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
          ))
        ) : items.length === 0 ? (
          <p className="text-gray-500">Belum ada data struktur desa</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className={`bg-white p-5 rounded-xl w-52 shadow hover:shadow-md transition-shadow ${getPreviewColumnClass(item.jabatan)}`}>
              <div className="w-16 h-16 bg-blue-200 mx-auto rounded-full mb-2 overflow-hidden flex items-center justify-center">
                {item.foto ? (
                  <img src={`${storageBase}${item.foto}`} alt={item.nama} className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-blue-800/60" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                  </svg>
                )}
              </div>
              <h3 className="font-semibold">{item.nama}</h3>
              <p className="text-sm text-blue-600">{item.jabatan}</p>
            </div>
          ))
        )}
      </div>
      <Link to="/struktur-desa">
        <button className="mt-6 bg-blue-400 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-colors">
          LIHAT SELENGKAPNYA
        </button>
      </Link>
    </div>
  );
}

function LandingPage() {
  const [previewJasa, setPreviewJasa] = useState<PublicKatalogItem[]>([]);
  const [loadingKatalog, setLoadingKatalog] = useState(true);
  const POLL_INTERVAL_MS = 15000;
  const storageBaseUrl = useMemo(() => BASE_URL.replace(/\/api$/, "") + "/storage/", []);
  const token = authStorage.getToken();
  const role = authStorage.getRole();
  const dashboardPath = role === "admin" || role === "super-admin"
    ? "/admin/dashboard"
    : "/warga/dashboard";

  const fetchPreviewKatalog = useCallback(async (isInitial = false) => {
    if (isInitial) setLoadingKatalog(true);
    try {
      const res = await api.get('/katalog');
      const rows = (res.data?.data ?? []) as PublicKatalogItem[];
      setPreviewJasa(rows.slice(0, 5));
    } catch {
      // keep current data to avoid flicker on intermittent errors
    } finally {
      if (isInitial) setLoadingKatalog(false);
    }
  }, []);

  useEffect(() => {
    fetchPreviewKatalog(true);
    const intervalId = window.setInterval(() => {
      fetchPreviewKatalog(false);
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [fetchPreviewKatalog]);

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

  return (
    <div className="font-sans">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <div className="flex items-center gap-4">
          <img src={logo} className="w-14 h-14 object-contain" alt="Logo Desa" />
          <span className="text-2xl font-extrabold text-[#1e3a5f]">Desa Karangasem</span>
        </div>
        <Link to={token ? dashboardPath : "/login"}>
          <button className="bg-blue-400 text-white px-5 py-1 rounded-full hover:bg-blue-500 transition-colors">
            {token ? "Dashboard" : "Masuk"}
          </button>
        </Link>
      </div>

      {/* HERO */}
      <div
        className="relative h-[85vh] flex items-center justify-center text-white"
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
      <StrukturPreview />

      {/* KATALOG */}
      <div id="katalog-jasa" className="py-12 bg-[#e8edf5]">
        <h2 className="text-xl font-bold text-blue-800 mb-8 text-center">
          KATALOG JASA WARGA
        </h2>
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
            {loadingKatalog ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-sm overflow-hidden animate-pulse">
                  <div className="h-28 bg-gray-200" />
                  <div className="p-3">
                    <div className="h-3 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded mb-2" />
                    <div className="h-10 bg-gray-200 rounded mb-2" />
                    <div className="h-3 bg-gray-200 rounded" />
                  </div>
                </div>
              ))
            ) : previewJasa.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl p-6 text-center text-gray-500">
                Belum ada jasa aktif yang dipublikasikan.
              </div>
            ) : previewJasa.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200 flex flex-col"
              >
                {item.gambar ? (
                  <img
                    src={`${storageBaseUrl}${item.gambar}`}
                    alt={item.nama_produk}
                    className="h-28 w-full object-cover"
                  />
                ) : (
                  <div className="bg-blue-100 h-28 flex items-center justify-center">
                    <span className="text-4xl">🛍️</span>
                  </div>
                )}
                <div className="p-3 flex flex-col flex-1">
                  <h3 className="font-bold text-blue-800 text-xs">
                    {item.user?.name || "Warga"}
                  </h3>
                  <p className="font-semibold text-gray-800 text-xs">
                    {item.nama_produk}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 flex-1 line-clamp-2">
                    {item.deskripsi}
                  </p>
                  <div className="mt-2">
                    <span className="font-bold text-gray-800 text-xs">
                      {formatRupiah(item.harga)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!item.kontak_wa) return;
                      const phone = item.kontak_wa.replace(/[^0-9]/g, "");
                      window.open(`https://wa.me/${phone}`, "_blank");
                    }}
                    disabled={!item.kontak_wa}
                    className="mt-2 bg-green-500 hover:bg-green-600 text-white text-xs font-semibold
                      px-3 py-1.5 rounded-lg transition-transform duration-150 active:scale-95 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
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
      <footer className="bg-[#0f172a] text-white py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-2">
            <img src={logo} alt="Logo Desa Karangasem" className="w-10 h-10 object-contain grayscale" />
            <span className="text-xl font-bold tracking-wide">Desa Karangasem</span>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            Portal Sistem Informasi Administrasi Desa
          </p>
          <p className="text-xs text-gray-500">
            &copy; 2026 Desa Karangasem. Hak cipta dilindungi.
          </p>
        </div>
      </footer>
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginAdmin />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/lupa-password" element={<LupaPassword />} />
      <Route path="/verifikasi-otp" element={<VerifikasiOTP />} />
      <Route path="/ganti-password" element={<GantiPassword />} />
      <Route path="/struktur-desa" element={<StrukturDesa />} />
      <Route path="/katalog-jasa" element={<KatalogJasa />} />
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />
      <Route path="/warga/setup-akun" element={<SetupAkunWarga />} />

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
          <Route path="/admin/manajemen-perangkat" element={<ManajemenPerangkat />} />
          <Route path="/admin/struktur-desa" element={<StrukturDesa />} />
          <Route path="/admin/manajemen-struktur-desa" element={<ManajemenStrukturDesa />} />
        </Route>
      </Route>

      <Route element={<WargaRoutes />}>
        <Route element={<WargaLayout />}>
          <Route path="/warga/dashboard" element={<DashboardWarga />} />
          <Route path="/warga/pengajuan-surat" element={<PengajuanSurat />} />
          <Route path="/warga/katalog-jasa" element={<KatalogJasaWarga />} />
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
