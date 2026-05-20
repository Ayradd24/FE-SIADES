import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import bg from '../assets/sawah-bg.png';
import api, { BASE_URL } from '../lib/api';

interface StrukturDesaItem {
  id: number;
  nama: string;
  jabatan: string;
  alamat: string;
  no_wa: string;
  foto: string | null;
}

const storageBaseUrl = BASE_URL.replace(/\/api$/, '') + '/storage/';

function PersonCard({
  nama,
  jabatan,
  foto,
  size = 'normal',
}: {
  nama: string;
  jabatan: string;
  foto?: string | null;
  size?: 'normal' | 'large';
}) {
  const iconSize = size === 'large' ? 'w-24 h-24' : 'w-20 h-20';
  const cardPadding = size === 'large' ? 'px-8 py-6' : 'px-6 py-5';
  const cardWidth = size === 'large' ? 'w-64' : 'w-52';

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ${cardPadding} ${cardWidth} flex flex-col items-center 
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white`}
    >
      <div
        className={`${iconSize} rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 ring-4 ring-white shadow-md overflow-hidden`}
      >
        {foto ? (
          <img
            src={`${storageBaseUrl}${foto}`}
            alt={nama}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className={`${size === 'large' ? 'w-12 h-12' : 'w-10 h-10'} text-blue-800/70`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        )}
      </div>
      <h3 className="font-bold text-gray-800 text-base">{nama}</h3>
      <p className="text-sm font-semibold text-blue-700 mt-0.5">{jabatan}</p>
    </div>
  );
}

function DropdownSelector({
  options,
  value,
  onChange,
}: {
  options: { value: number; label: string }[];
  value: number;
  onChange: (val: number) => void;
}) {
  return (
    <div className="relative inline-block">
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="appearance-none bg-white border-2 border-blue-300 text-gray-800 font-semibold text-sm 
          rounded-lg px-4 py-2 pr-8 shadow-sm cursor-pointer
          focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400
          hover:border-blue-400 transition-colors duration-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

function WhatsAppButton({ wa }: { wa: string }) {
  if (!wa) return null;
  // Ensure the number starts with country code
  const phone = wa.replace(/[^0-9]/g, '');
  const formatted = phone.startsWith('0') ? '62' + phone.slice(1) : phone;
  return (
    <button
      type="button"
      onClick={() => window.open(`https://wa.me/${formatted}`, '_blank')}
      className="bg-green-500 hover:bg-green-600 text-white font-semibold 
        px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl
        transition-transform duration-150 active:scale-95"
    >
      Hubungi WA
    </button>
  );
}

const getRwNumber = (jabatan: string) => {
  const rwMatch = jabatan.match(/RW\s*(\d+)/i);
  return rwMatch ? rwMatch[1] : '';
};

export default function StrukturDesa() {
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [struktur, setStruktur] = useState<StrukturDesaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from API
    api.get('/struktur-desa')
      .then((response) => {
        const items = response.data?.data ?? response.data ?? [];
        setStruktur(Array.isArray(items) ? items : []);
      })
      .catch(() => {
        setStruktur([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Sort/filter data by jabatan
  const kepalaDesa = useMemo(
    () => struktur.find((o) => o.jabatan.toLowerCase() === 'kepala desa'),
    [struktur]
  );

  const staffUtama = useMemo(
    () =>
      struktur.filter(
        (o) =>
          o.jabatan.toLowerCase() === 'sekretaris desa' ||
          o.jabatan.toLowerCase() === 'bendahara desa'
      ),
    [struktur]
  );

  const ketuaRW = useMemo(
    () =>
      struktur.filter(
        (o) =>
          o.jabatan.toLowerCase().includes('rw') &&
          !o.jabatan.toLowerCase().includes('rt')
      ),
    [struktur]
  );

  const ketuaRT = useMemo(
    () => struktur.filter((o) => o.jabatan.toLowerCase().includes('rt')),
    [struktur]
  );

  const [selectedRWIdx, setSelectedRWIdx] = useState(0);
  const currentRW = ketuaRW[selectedRWIdx] ?? null;

  const activeRwNumber = useMemo(() => {
    return currentRW ? getRwNumber(currentRW.jabatan) : '';
  }, [currentRW]);

  const filteredRT = useMemo(() => {
    if (!activeRwNumber) return ketuaRT;
    return ketuaRT.filter((rt) => getRwNumber(rt.jabatan) === activeRwNumber);
  }, [ketuaRT, activeRwNumber]);

  const [selectedRTIdx, setSelectedRTIdx] = useState(0);
  const currentRT = filteredRT[selectedRTIdx] ?? null;

  // Reset selectedRWIdx if data changes
  useEffect(() => {
    setSelectedRWIdx(0);
  }, [ketuaRW.length]);

  // Reset selectedRTIdx if filtered RT options change
  useEffect(() => {
    setSelectedRTIdx(0);
  }, [filteredRT.length]);

  if (loading) {
    return (
      <div
        className={`font-sans min-h-screen flex items-center justify-center relative overflow-x-hidden ${isAdmin ? '-m-8' : ''}`}
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'scroll',
        }}
      >
        <div className="absolute inset-0 bg-blue-900/55 pointer-events-none" />
        <div className="relative text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
          <p className="text-lg font-medium">Memuat struktur desa...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`font-sans min-h-screen flex flex-col relative overflow-x-hidden ${isAdmin ? '-m-8' : ''}`}
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'scroll',
      }}
    >
      {/* Single overlay for the entire page */}
      <div className="absolute inset-0 bg-blue-900/55 pointer-events-none" />

      {/* Home Button (only public route) */}
      {!isAdmin && (
        <div className="relative max-w-5xl mx-auto w-full px-4 pt-8 pb-0 z-10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 bg-blue-400 hover:bg-blue-500 text-white
              px-5 py-1 rounded-full text-sm font-medium transition-colors shadow"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>
        </div>
      )}

      {/* ── KEPALA DESA SECTION ── */}
      <section className={`relative ${isAdmin ? 'pt-16' : 'pt-4'} pb-10 px-4`}>
        <div className="relative max-w-5xl mx-auto">
          <h1 className="text-center text-3xl md:text-4xl font-extrabold text-white tracking-wide mb-10 drop-shadow-lg">
            STRUKTUR PEMERINTAH DESA
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            {/* Sekretaris (left) */}
            {staffUtama[0] && (
              <div className="order-2 md:order-1">
                <PersonCard
                  nama={staffUtama[0].nama}
                  jabatan={staffUtama[0].jabatan}
                  foto={staffUtama[0].foto}
                />
              </div>
            )}

            {/* Kepala Desa (center) */}
            {kepalaDesa && (
              <div className="order-1 md:order-2 scale-105 md:scale-110">
                <PersonCard
                  nama={kepalaDesa.nama}
                  jabatan={kepalaDesa.jabatan}
                  foto={kepalaDesa.foto}
                  size="large"
                />
              </div>
            )}

            {/* Bendahara (right) */}
            {staffUtama[1] && (
              <div className="order-3">
                <PersonCard
                  nama={staffUtama[1].nama}
                  jabatan={staffUtama[1].jabatan}
                  foto={staffUtama[1].foto}
                />
              </div>
            )}
          </div>

          {/* If no data at all */}
          {!kepalaDesa && staffUtama.length === 0 && (
            <div className="text-center text-white/80 py-8">
              <p className="text-lg">Belum ada data pejabat desa</p>
            </div>
          )}
        </div>
      </section>

      {/* Divider */}
      <div className="relative mx-auto w-full max-w-5xl px-4">
        <div className="border-t border-white/20" />
      </div>

      {/* ── RW SECTION ── */}
      {ketuaRW.length > 0 && (
        <section className="relative py-10 px-4">
          <div className="relative max-w-5xl mx-auto">
            <div className="mb-6">
              <DropdownSelector
                options={ketuaRW.map((rw, idx) => ({
                  value: idx,
                  label: rw.jabatan.toLowerCase().startsWith('ketua') 
                    ? rw.jabatan.replace(/^Ketua\s+/i, '') 
                    : rw.jabatan,
                }))}
                value={selectedRWIdx}
                onChange={(val) => setSelectedRWIdx(val)}
              />
            </div>

            {currentRW && (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <PersonCard
                  nama={currentRW.nama}
                  jabatan={currentRW.jabatan.replace(/^Ketua\s+/i, '')}
                  foto={currentRW.foto}
                />
                <div className="flex flex-col justify-center gap-3">
                  {currentRW.alamat && (
                    <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                      Alamat : {currentRW.alamat}
                    </h2>
                  )}
                  <WhatsAppButton wa={currentRW.no_wa} />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Divider */}
      {filteredRT.length > 0 && (
        <div className="relative mx-auto w-full max-w-5xl px-4">
          <div className="border-t border-white/20" />
        </div>
      )}

      {/* ── RT SECTION ── */}
      {filteredRT.length > 0 && (
        <section className="relative py-10 px-4 flex-1">
          <div className="relative max-w-5xl mx-auto">
            <div className="mb-6">
              <DropdownSelector
                options={filteredRT.map((rt, idx) => ({
                  value: idx,
                  label: rt.jabatan.replace(/^Ketua\s+/i, '').replace(/RW\s*\d+/i, '').trim(),
                }))}
                value={selectedRTIdx}
                onChange={(val) => setSelectedRTIdx(val)}
              />
            </div>

            {currentRT && (
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <PersonCard
                  nama={currentRT.nama}
                  jabatan={currentRT.jabatan.replace(/^Ketua\s+/i, '').replace(/RW\s*\d+/i, '').trim()}
                  foto={currentRT.foto}
                />
                <div className="flex flex-col justify-center gap-3">
                  {currentRT.alamat && (
                    <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                      Alamat : {currentRT.alamat}
                    </h2>
                  )}
                  <WhatsAppButton wa={currentRT.no_wa} />
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── FOOTER ── */}
      <footer className="relative bg-gray-800/90 backdrop-blur-sm text-white py-5 mt-auto">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Alamat Balai Desa</p>
                <p className="text-sm">Jl. Sigur No.1</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">Kontak Desa (Telp/WA)</p>
                <p className="text-sm">(021) 1234 5678 | 0812-3456-7890</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-600 pt-3 text-center">
            <p className="text-xs text-gray-400">&copy; COPYRIGHT DESA KARANGASEM 2026</p>
          </div>
        </div>
      </footer>
    </div>
  );
}