import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import bg from '../assets/sawah-bg.png';
import logoDesaImg from '../assets/logo-desa.png';
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
  onClick,
}: {
  nama: string;
  jabatan: string;
  foto?: string | null;
  size?: 'normal' | 'large';
  onClick?: () => void;
}) {
  const iconSize = size === 'large' ? 'w-24 h-24' : 'w-20 h-20';
  const cardPadding = size === 'large' ? 'px-8 py-6' : 'px-6 py-5';
  const cardWidth = size === 'large' ? 'w-64' : 'w-52';

  return (
    <div
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ${cardPadding} ${cardWidth} flex flex-col items-center 
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 hover:bg-white 
        ${onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
    >
      <div
        className={`${iconSize} rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mb-3 ring-4 ring-white shadow-md overflow-hidden`}
      >
        {foto ? (
          <img
            src={`${storageBaseUrl}${foto}`}
            alt={nama}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className={`${size === 'large' ? 'w-12 h-12' : 'w-10 h-10'} text-slate-400`}
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        )}
      </div>
      <h3 className="font-bold text-gray-800 text-base text-center w-full truncate" title={nama}>{nama}</h3>
      <p className="text-sm font-semibold text-blue-700 mt-0.5 text-center w-full truncate" title={jabatan}>{jabatan}</p>
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
      className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-600 
        hover:from-emerald-600 hover:to-green-700 text-white font-semibold 
        px-5 py-2.5 rounded-xl shadow-lg hover:shadow-green-500/20 hover:-translate-y-0.5
        transition-all duration-200 active:scale-95 text-sm"
    >
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.37 5.378 0 12.003 0a11.902 11.902 0 018.484 3.515c2.27 2.27 3.52 5.289 3.513 8.497-.006 6.628-5.38 12-12.01 12-2.002-.001-3.973-.496-5.735-1.436L0 24zm6.59-4.846c1.6.95 3.498 1.453 5.418 1.454 5.56 0 10.084-4.522 10.088-10.086.002-2.695-1.047-5.227-2.956-7.137A9.98 9.98 0 0012.003 1.916c-5.56 0-10.085 4.522-10.09 10.087-.001 1.9.49 3.754 1.42 5.39l-1.018 3.714 3.822-.996zM17.15 14.5c-.282-.14-.167-.624-.87-.974-.105-.052-.218-.08-.328-.08-.266 0-.518.156-.66.413-.19.345-.38.79-.58 1.1-.184.288-.475.32-.782.164-2.036-1.015-3.32-2.71-3.82-3.566-.184-.316-.017-.487.15-.653.116-.118.258-.3.387-.45.13-.15.172-.25.258-.417.086-.167.043-.313-.02-.45-.064-.137-.58-1.402-.796-1.92-.21-.504-.424-.41-.58-.418-.15-.008-.323-.008-.495-.008-.172 0-.45.064-.688.32-.237.258-.903.882-.903 2.148 0 1.266.925 2.49 1.05 2.66.128.17 1.8 2.75 4.37 3.86 2.14.92 2.91.74 3.95.58 1.05-.16 2.27-.928 2.59-1.83.32-.904.32-1.68.225-1.837-.095-.157-.352-.297-.635-.437z"/>
      </svg>
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
  const [selectedPerson, setSelectedPerson] = useState<StrukturDesaItem | null>(null);

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
    <div className={`font-sans min-h-screen flex flex-col relative overflow-x-hidden ${isAdmin ? '-m-8' : ''}`}>
      {/* Background Image with Blur */}
      <div 
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${bg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(5px) brightness(0.7)',
          transform: 'scale(1.03)', // Prevent white edges from blur
          zIndex: -10,
        }}
      />
      {/* Dark Slate Overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/40 pointer-events-none" 
        style={{ zIndex: -10 }}
      />

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
            Beranda
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
                  onClick={() => setSelectedPerson(staffUtama[0])}
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
                  onClick={() => setSelectedPerson(kepalaDesa)}
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
                  onClick={() => setSelectedPerson(staffUtama[1])}
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 drop-shadow">Ketua RW</h2>
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
                <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 shadow-inner">
                  <div className="flex-shrink-0">
                    <PersonCard
                      nama={currentRW.nama}
                      jabatan={currentRW.jabatan.replace(/^Ketua\s+/i, '')}
                      foto={currentRW.foto}
                    />
                  </div>
                  <div className="flex flex-col justify-between py-2 flex-grow min-w-0 gap-4 text-center md:text-left">
                    {currentRW.alamat && (
                      <div className="min-w-0">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-white/70 mb-1.5">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Alamat Rumah</span>
                        </div>
                        <p className="text-base md:text-lg font-medium text-white drop-shadow-sm break-all md:break-words whitespace-pre-wrap">
                          {currentRW.alamat.length > 500
                            ? currentRW.alamat.slice(0, 500) + '...'
                            : currentRW.alamat}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-center md:justify-start items-end mt-2 md:mt-auto">
                      <WhatsAppButton wa={currentRW.no_wa} />
                    </div>
                  </div>
                </div>
              )}
            </div>
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
            <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4 drop-shadow">Ketua RT</h2>
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
                <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6 bg-white/5 border border-white/10 rounded-2xl p-6 transition-all duration-300 shadow-inner">
                  <div className="flex-shrink-0">
                    <PersonCard
                      nama={currentRT.nama}
                      jabatan={currentRT.jabatan.replace(/^Ketua\s+/i, '').replace(/RW\s*\d+/i, '').trim()}
                      foto={currentRT.foto}
                    />
                  </div>
                  <div className="flex flex-col justify-between py-2 flex-grow min-w-0 gap-4 text-center md:text-left">
                    {currentRT.alamat && (
                      <div className="min-w-0">
                        <div className="flex items-center justify-center md:justify-start gap-2 text-white/70 mb-1.5">
                          <MapPin className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Alamat Rumah</span>
                        </div>
                        <p className="text-base md:text-lg font-medium text-white drop-shadow-sm break-all md:break-words whitespace-pre-wrap">
                          {currentRT.alamat.length > 500
                            ? currentRT.alamat.slice(0, 500) + '...'
                            : currentRT.alamat}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-center md:justify-start items-end mt-2 md:mt-auto">
                      <WhatsAppButton wa={currentRT.no_wa} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
      {/* ── CSS KEYFRAMES INLINE ── */}
      <style>{`
        @keyframes modalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalScaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-modal-fade-in {
          animation: modalFadeIn 0.2s ease-out forwards;
        }
        .animate-modal-scale-up {
          animation: modalScaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        /* Custom scrollbar for modal address */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.15);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }
      `}</style>

      {/* ── DETAIL MODAL ── */}
      {selectedPerson && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-modal-fade-in"
          onClick={() => setSelectedPerson(null)}
        >
          {/* Modal Container */}
          <div 
            className="relative w-full max-w-sm bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl text-white flex flex-col items-center overflow-hidden animate-modal-scale-up"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Ambient Background Glow inside Modal */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={() => setSelectedPerson(null)}
              className="absolute top-4 right-4 text-white/50 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-full transition-all active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Profile Picture */}
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center mb-4 ring-4 ring-white/10 shadow-xl overflow-hidden relative">
              {selectedPerson.foto ? (
                <img
                  src={`${storageBaseUrl}${selectedPerson.foto}`}
                  alt={selectedPerson.nama}
                  className="w-full h-full object-cover"
                />
              ) : (
                <svg className="w-10 h-10 text-slate-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                </svg>
              )}
            </div>

            {/* Name & Title */}
            <h3 className="text-lg md:text-xl font-extrabold text-white text-center drop-shadow-sm px-4">
              {selectedPerson.nama}
            </h3>
            <span className="mt-1 px-3 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-full text-xs font-semibold uppercase tracking-wider">
              {selectedPerson.jabatan}
            </span>

            {/* Divider */}
            <div className="w-full border-t border-white/10 my-4" />

            {/* Details Section */}
            <div className="w-full space-y-4">
              {/* Address */}
              <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-start gap-3 min-w-0">
                <MapPin className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-0.5">
                    Alamat Rumah
                  </span>
                  <div className="max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                    <p className="text-sm text-gray-200 break-all whitespace-pre-wrap leading-relaxed">
                      {selectedPerson.alamat || 'Alamat belum dicantumkan.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Whatsapp */}
              {selectedPerson.no_wa && (
                <div className="w-full flex flex-col items-center pt-1">
                  <WhatsAppButton wa={selectedPerson.no_wa} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── FOOTER ── */}
      <footer className="relative bg-[#0f172a]/95 backdrop-blur-sm text-white py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-6 flex flex-col items-center">
          {/* Logo & Portal Info */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center gap-3 mb-2">
              <img src={logoDesaImg} alt="Logo Desa Karangasem" className="w-10 h-10 object-contain grayscale" />
              <span className="text-xl font-bold tracking-wide">Desa Karangasem</span>
            </div>
            <p className="text-sm text-gray-300">
              Portal Sistem Informasi Administrasi Desa
            </p>
          </div>

          {/* Alamat & Kontak (jangan dihilangkan) */}
          <div className="w-full border-t border-slate-700/60 pt-6 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Alamat Balai Desa</p>
                <p className="text-sm text-gray-200">Jl. Sigur No.1</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.36 11.36 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1 11.36 11.36 0 00.57 3.58 1 1 0 01-.25 1.01l-2.2 2.2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Kontak Desa (Telp/WA)</p>
                <p className="text-sm text-gray-200">(021) 1234 5678 | 0812-3456-7890</p>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="w-full border-t border-slate-800/60 pt-4 text-center">
            <p className="text-xs text-gray-500">
              &copy; 2026 Desa Karangasem. Hak cipta dilindungi.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}