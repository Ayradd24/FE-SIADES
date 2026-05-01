import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import logoDesaImg from '../../assets/logo-desa.png';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const HomeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const DocumentIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const ShopIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

const WalletIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const ArrowLeftIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const navItems: NavItem[] = [
  { label: 'Beranda Admin', path: '/admin/dashboard', icon: <HomeIcon /> },
  { label: 'Persetujuan Surat', path: '/admin/persetujuan-surat', icon: <DocumentIcon /> },
  { label: 'Data Warga', path: '/admin/data-warga', icon: <UsersIcon /> },
  { label: 'Manajemen E-Katalog', path: '/admin/manajemen-katalog', icon: <ShopIcon /> },
  { label: 'Manajemen Iuran & Kas', path: '/admin/manajemen-iuran', icon: <WalletIcon /> },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('siades_token');
    localStorage.removeItem('siades_role');
    navigate('/admin/login');
  };

  return (
    <aside className="fixed left-0 top-0 h-full w-52 bg-[#e8edf5] border-r border-blue-100 flex flex-col z-40">
      {/* Profile Area */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-blue-100">
        <div className="w-20 h-20 rounded-2xl bg-blue-200 flex items-center justify-center mb-3 overflow-hidden">
          <svg className="w-12 h-12 text-[#1e3a5f]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
          </svg>
        </div>
        <span className="font-bold text-[#1e3a5f] text-sm">
          {localStorage.getItem('siades_name') || 'Admin SIADES'}
        </span>
        <span className="text-xs font-bold text-[#1e3a5f] uppercase tracking-widest mt-0.5">
          KADES
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-300/50 text-blue-700 font-semibold'
                  : 'text-[#1e3a5f] hover:bg-blue-100'
              }`
            }
          >
            {item.icon}
            <span className="leading-tight">{item.label}</span>
          </NavLink>
        ))}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[#1e3a5f] hover:bg-red-100 hover:text-red-600 transition-all duration-200 mt-2"
        >
          <LogoutIcon />
          <span>Logout</span>
        </button>
      </nav>

      {/* Back to Home */}
      <div className="px-3 pb-4">
        <button
          onClick={() => navigate('/')}
          className="w-full flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
        >
          <ArrowLeftIcon />
          Beranda Desa
        </button>
      </div>

      {/* Logo at bottom */}
      <div className="px-4 pb-3 flex items-center gap-2 opacity-50">
        <img src={logoDesaImg} alt="Logo Desa" className="w-6 h-6 object-contain" />
        <span className="text-xs text-[#1e3a5f] font-medium">Desa Karangasem</span>
      </div>
    </aside>
  );
};

export default Sidebar;
