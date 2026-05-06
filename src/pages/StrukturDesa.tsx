import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bg from '../assets/sawah-bg.png';

interface Pejabat {
  nama: string;
  jabatan: string;
  foto?: string;
}

interface RWData {
  id: number;
  label: string;
  ketua: Pejabat;
  alamat: string;
  wa: string;
  rtList: RTData[];
}

interface RTData {
  id: number;
  label: string;
  ketua: Pejabat;
  alamat: string;
  wa: string;
}

const kepalaDesa: Pejabat = { nama: 'Ahmad', jabatan: 'Kepala Desa' };
const sekretaris: Pejabat = { nama: 'Ronaldo', jabatan: 'Sekretaris Desa' };
const bendahara: Pejabat = { nama: 'Messi', jabatan: 'Bendahara Desa' };

const rwList: RWData[] = [
  {
    id: 1,
    label: 'RW 001',
    ketua: { nama: 'Mulyono', jabatan: 'Ketua RW' },
    alamat: 'Jalan Sigur no 14',
    wa: '6281234567890',
    rtList: [
      {
        id: 1,
        label: 'RT 001',
        ketua: { nama: 'Agus', jabatan: 'Ketua RT' },
        alamat: 'Jalan Garuda No 3',
        wa: '6281234567891',
      },
      {
        id: 2,
        label: 'RT 002',
        ketua: { nama: 'Budi', jabatan: 'Ketua RT' },
        alamat: 'Jalan Merpati No 7',
        wa: '6281234567892',
      },
    ],
  },
  {
    id: 2,
    label: 'RW 002',
    ketua: { nama: 'Slamet', jabatan: 'Ketua RW' },
    alamat: 'Jalan Melati No 5',
    wa: '6281234567893',
    rtList: [
      {
        id: 3,
        label: 'RT 001',
        ketua: { nama: 'Hendra', jabatan: 'Ketua RT' },
        alamat: 'Jalan Cendana No 12',
        wa: '6281234567894',
      },
    ],
  },
];

function PersonCard({
  pejabat,
  size = 'normal',
}: {
  pejabat: Pejabat;
  size?: 'normal' | 'large';
}) {
  const iconSize = size === 'large' ? 'w-24 h-24' : 'w-20 h-20';
  const cardPadding = size === 'large' ? 'px-8 py-6' : 'px-6 py-5';

  return (
    <div
      className={`bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg ${cardPadding} flex flex-col items-center 
        transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:bg-white`}
    >
      <div
        className={`${iconSize} rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center mb-3 ring-4 ring-white shadow-md`}
      >
        <svg
          className={`${size === 'large' ? 'w-12 h-12' : 'w-10 h-10'} text-blue-800/70`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
        </svg>
      </div>
      <h3 className="font-bold text-gray-800 text-base">{pejabat.nama}</h3>
      <p className="text-sm font-semibold text-blue-700 mt-0.5">{pejabat.jabatan}</p>
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
  return (
    <button
      type="button"
      onClick={() => { }}
      className="bg-green-500 hover:bg-green-600 text-white font-semibold 
        px-6 py-2.5 rounded-lg shadow-lg hover:shadow-xl
        transition-transform duration-150 active:scale-95"
    >
      Hubungi WA
    </button>
  );
}

export default function StrukturDesa() {
  const navigate = useNavigate();
  const [selectedRW, setSelectedRW] = useState(rwList[0].id);
  const currentRW = rwList.find((rw) => rw.id === selectedRW) ?? rwList[0];

  const [selectedRT, setSelectedRT] = useState(currentRW.rtList[0]?.id ?? 0);
  const currentRT = currentRW.rtList.find((rt) => rt.id === selectedRT) ?? currentRW.rtList[0];

  const handleRWChange = (rwId: number) => {
    setSelectedRW(rwId);
    const newRW = rwList.find((rw) => rw.id === rwId);
    if (newRW && newRW.rtList.length > 0) {
      setSelectedRT(newRW.rtList[0].id);
    }
  };

  return (
    <div
      className="font-sans -m-8 min-h-screen flex flex-col relative"
      style={{
        backgroundImage: `url(${bg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Single overlay for the entire page */}
      <div className="absolute inset-0 bg-blue-900/55 pointer-events-none" />

      {/* ── KEPALA DESA SECTION ── */}
      <section className="relative py-10 px-4">
        <div className="relative max-w-5xl mx-auto">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-white bg-blue-600/80 hover:bg-blue-600 backdrop-blur-sm 
              px-4 py-1.5 rounded-full text-sm font-medium mb-6 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Home
          </button>

          <h1 className="text-center text-3xl md:text-4xl font-extrabold text-white tracking-wide mb-10 drop-shadow-lg">
            KEPALA DESA
          </h1>

          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
            <div className="order-2 md:order-1">
              <PersonCard pejabat={sekretaris} />
            </div>
            <div className="order-1 md:order-2 scale-105 md:scale-110">
              <PersonCard pejabat={kepalaDesa} size="large" />
            </div>
            <div className="order-3">
              <PersonCard pejabat={bendahara} />
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="relative mx-auto w-full max-w-5xl px-4">
        <div className="border-t border-white/20" />
      </div>

      {/* ── RW SECTION ── */}
      <section className="relative py-10 px-4">
        <div className="relative max-w-5xl mx-auto">
          <div className="mb-6">
            <DropdownSelector
              options={rwList.map((rw) => ({ value: rw.id, label: rw.label }))}
              value={selectedRW}
              onChange={handleRWChange}
            />
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            <PersonCard pejabat={currentRW.ketua} />
            <div className="flex flex-col justify-center gap-3">
              <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                Alamat : {currentRW.alamat}
              </h2>
              <WhatsAppButton wa={currentRW.wa} />
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="relative mx-auto w-full max-w-5xl px-4">
        <div className="border-t border-white/20" />
      </div>

      {/* ── RT SECTION ── */}
      <section className="relative py-10 px-4 flex-1">
        <div className="relative max-w-5xl mx-auto">
          <div className="mb-6">
            <DropdownSelector
              options={currentRW.rtList.map((rt) => ({ value: rt.id, label: rt.label }))}
              value={selectedRT}
              onChange={setSelectedRT}
            />
          </div>

          {currentRT && (
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <PersonCard pejabat={currentRT.ketua} />
              <div className="flex flex-col justify-center gap-3">
                <h2 className="text-xl md:text-2xl font-bold text-white drop-shadow">
                  Alamat : {currentRT.alamat}
                </h2>
                <WhatsAppButton wa={currentRT.wa} />
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative bg-gray-800/90 backdrop-blur-sm text-white py-5">
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