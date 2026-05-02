import { Routes, Route, Navigate } from 'react-router-dom';

// Landing page components (existing)
import logo from './assets/logo-desa.png';
import bg from './assets/sawah-bg.png';

// Auth pages
import LoginAdmin from './pages/admin/LoginAdmin';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/admin/Dashboard';
import DataWarga from './pages/admin/DataWarga';
import PersetujuanSurat from './pages/admin/PersetujuanSurat';
import ManajemenKatalog from './pages/admin/ManajemenKatalog';
import ManajemenIuran from './pages/admin/ManajemenIuran';

// Layout & Router
import AdminLayout from './components/layout/AdminLayout';
import AdminRoutes from './router/AdminRoutes';

// ============================================================
// Landing Page (original)
// ============================================================
function LandingPage() {
  return (
    <div className="font-sans">
      {/* NAVBAR */}
      <div className="flex justify-between items-center px-8 py-4 bg-white shadow">
        <div className="flex items-center gap-3">
          <img src={logo} className="w-10 h-10" alt="Logo Desa" />
          <span className="font-semibold text-blue-800">Desa Karangasem</span>
        </div>
        <a href="/admin/login">
          <button className="bg-blue-400 text-white px-5 py-1 rounded-full hover:bg-blue-500 transition-colors">
            Login Admin
          </button>
        </a>
      </div>

      {/* HERO */}
      <div
        className="relative h-[400px] flex items-center justify-center text-white"
        style={{ backgroundImage: `url(${bg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      >
        <div className="absolute inset-0 bg-blue-900/50" />
        <div className="relative text-center px-4 max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">Selamat Datang di Portal Desa Karangasem</h1>
          <p className="mb-4 text-sm">Mewujudkan desa yang transparan, inovatif, dan mandiri</p>
          <button className="bg-blue-400 px-6 py-2 rounded-full hover:bg-blue-500 transition-colors">
            LIHAT E-KATALOG JASA WARGA
          </button>
        </div>
      </div>

      {/* STRUKTUR */}
      <div className="py-12 text-center bg-gray-100">
        <h2 className="text-xl font-bold text-blue-800 mb-8">STRUKTUR PEMERINTAH DESA</h2>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { nama: 'Mulyono', jabatan: 'Ketua RW' },
            { nama: 'Ahmad', jabatan: 'Kepala Desa' },
            { nama: 'Agus', jabatan: 'Ketua RT' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-5 rounded-xl w-52 shadow">
              <div className="w-16 h-16 bg-blue-200 mx-auto rounded-full mb-2" />
              <h3 className="font-semibold">{item.nama}</h3>
              <p className="text-sm text-green-600">{item.jabatan}</p>
            </div>
          ))}
        </div>
        <button className="mt-6 bg-blue-400 text-white px-6 py-2 rounded-full hover:bg-blue-500 transition-colors">
          LIHAT SELENGKAPNYA
        </button>
      </div>

      {/* KATALOG */}
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold text-blue-800 mb-8">KATALOG JASA WARGA</h2>
        <div className="flex justify-center gap-6 flex-wrap">
          {[
            { nama: 'Bambang', jasa: 'Servis Listrik', harga: 'Rp 30.000' },
            { nama: 'Endang', jasa: 'Catering', harga: 'Rp 25.000' },
            { nama: 'Bejon', jasa: 'Kerajinan Kayu', harga: 'Rp 250.000' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-4 rounded-xl w-52 shadow">
              <h3 className="font-semibold">{item.nama}</h3>
              <p className="text-sm">{item.jasa}</p>
              <p className="text-blue-500">{item.harga}</p>
              <button className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 transition-colors">
                Hubungi WA
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* FOOTER */}
      <div className="bg-gray-700 text-white text-center py-4">
        © 2026 Desa Karangasem
      </div>
    </div>
  );
}

// ============================================================
// App Router
// ============================================================
function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      {/* Login universal — semua user (admin & warga) pakai halaman yang sama */}
      <Route path="/login" element={<LoginAdmin />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Legacy redirect: /admin/login → /login */}
      <Route path="/admin/login" element={<Navigate to="/login" replace />} />

      {/* Protected admin routes */}
      <Route element={<AdminRoutes />}>
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<Dashboard />} />
          <Route path="/admin/data-warga" element={<DataWarga />} />
          <Route path="/admin/persetujuan-surat" element={<PersetujuanSurat />} />
          <Route path="/admin/manajemen-katalog" element={<ManajemenKatalog />} />
          <Route path="/admin/manajemen-iuran" element={<ManajemenIuran />} />
        </Route>
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;