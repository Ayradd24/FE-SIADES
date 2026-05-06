import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../lib/api';
import logoDesaImg from '../assets/logo-desa.png';

/**
 * HALAMAN REGISTER (Buat Akun) — untuk warga desa
 *
 * API Endpoint: POST /auth/register
 * Request body : {
 *   namaLengkap: string,
 *   email: string,
 *   nomorWA: string,
 *   password: string,
 *   konfirmasiPassword: string
 * }
 * Response: { message: string, token?: string, role?: string }
 *
 * Setelah register berhasil → redirect ke /login
 */

interface RegisterForm {
  namaLengkap: string;
  NIK: string;
  nomorkk: string;
  username: string;
  password: string;
  konfirmasiPassword: string;
}

interface RegisterErrors {
  namaLengkap?: string;
  NIK?: string;
  nomorkk?: string;
  username?: string;
  password?: string;
  konfirmasiPassword?: string;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegisterForm>({
    namaLengkap: '',
    NIK: '',
    nomorkk: '',
    username: '',
    password: '',
    konfirmasiPassword: '',
  });
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showKonfirmasi, setShowKonfirmasi] = useState(false);

  const validate = (): boolean => {
    const newErrors: RegisterErrors = {};
    if (!form.namaLengkap.trim()) newErrors.namaLengkap = 'Nama lengkap tidak boleh kosong';
    if (!form.NIK) {
      newErrors.NIK = 'NIK tidak boleh kosong';
    } else if (!/^\d{16}$/.test(form.NIK)) {
      newErrors.NIK = 'Format NIK tidak valid (16 digit angka)';
    }
    if (!form.nomorkk) {
      newErrors.nomorkk = 'Nomor Kartu Keluarga tidak boleh kosong';
    } else if (!/^\d{16}$/.test(form.nomorkk)) {
      newErrors.nomorkk = 'Format nomor KK tidak valid (16 digit angka)';
    }
    if (!form.username) {
      newErrors.username = 'Username tidak boleh kosong';
    }
    if (!form.password) {
      newErrors.password = 'Password tidak boleh kosong';
    } else if (form.password.length < 8) {
      newErrors.password = 'Password minimal 8 karakter';
    }
    if (!form.konfirmasiPassword) {
      newErrors.konfirmasiPassword = 'Konfirmasi password tidak boleh kosong';
    } else if (form.password !== form.konfirmasiPassword) {
      newErrors.konfirmasiPassword = 'Password tidak cocok';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof RegisterErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await api.post('/auth/register', {
        namaLengkap: form.namaLengkap,
        NIK: form.NIK,
        nomorkk: form.nomorkk,
        username: form.username,
        password: form.password,
        konfirmasiPassword: form.konfirmasiPassword,
      });

      navigate('/login', { state: { successMessage: 'Akun berhasil dibuat! Silakan masuk.' } });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 409) {
        setErrors({ general: 'NIK sudah terdaftar. Silakan gunakan NIK lain.' });
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Terjadi kesalahan. Silakan coba beberapa saat lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    id,
    label,
    name,
    show,
    onToggle,
    error,
    placeholder = '••••••••',
  }: {
    id: string;
    label: string;
    name: keyof RegisterForm;
    show: boolean;
    onToggle: () => void;
    error?: string;
    placeholder?: string;
  }) => (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-semibold text-[#1e3a5f] mb-2">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? 'text' : 'password'}
          placeholder={placeholder}
          value={form[name]}
          onChange={handleChange}
          className={`input-field pr-12 ${error ? 'border-red-400 focus:ring-red-300' : ''}`}
        />
        <button type="button" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          )}
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#e8edf5] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <img src={logoDesaImg} alt="Logo Desa Karangasem" className="w-14 h-14 object-contain" />
        <h1 className="text-2xl font-extrabold text-[#1e3a5f]">DAFTAR AKUN PORTAL DESA</h1>
      </header>

      {/* Back button */}
      <div className="px-8 pt-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-400 hover:bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Home
        </Link>
      </div>

      {/* Register Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-lg p-10">
          <h2 className="text-center text-xl font-extrabold text-[#1e3a5f] mb-8 uppercase tracking-wide">
            Buat Akun Baru
          </h2>

          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Nama Lengkap */}
            <div className="mb-4">
              <label htmlFor="namaLengkap" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Nama Lengkap
              </label>
              <input
                id="namaLengkap"
                name="namaLengkap"
                type="text"
                autoComplete="name"
                placeholder="Nama sesuai KTP"
                value={form.namaLengkap}
                onChange={handleChange}
                className={`input-field ${errors.namaLengkap ? 'border-red-400 focus:ring-red-300' : ''}`}
              />
              {errors.namaLengkap && <p className="mt-1 text-xs text-red-500">{errors.namaLengkap}</p>}
            </div>

            {/* NIK */}
            <div className="mb-4">
              <label htmlFor="NIK" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                NIK
              </label>
              <input
                id="NIK"
                name="NIK"
                type="text"
                autoComplete="NIK"
                placeholder="16 digit NIK"
                value={form.NIK}
                onChange={handleChange}
                className={`input-field ${errors.NIK ? 'border-red-400 focus:ring-red-300' : ''}`}
              />
              {errors.NIK && <p className="mt-1 text-xs text-red-500">{errors.NIK}</p>}
            </div>

            {/* Nomor Kartu Keluarga */}
            <div className="mb-4">
              <label htmlFor="nomorkk" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Nomor Kartu Keluarga
              </label>
              <input
                id="nomorkk"
                name="nomorkk"
                type="tel"
                autoComplete="tel"
                placeholder="16 digit Nomor Kartu Keluarga"
                value={form.nomorkk}
                onChange={handleChange}
                className={`input-field ${errors.nomorkk ? 'border-red-400 focus:ring-red-300' : ''}`}
              />
              {errors.nomorkk && <p className="mt-1 text-xs text-red-500">{errors.nomorkk}</p>}
            </div>

              {/* Username */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                placeholder="Masukan username"
                value={form.username}
                onChange={handleChange}
                className={`input-field ${errors.username ? 'border-red-400 focus:ring-red-300' : ''}`}
              />
              {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
            </div>

            <PasswordInput
              id="password"
              label="Password"
              name="password"
              show={showPassword}
              onToggle={() => setShowPassword((v) => !v)}
              error={errors.password}
            />

            <PasswordInput
              id="konfirmasiPassword"
              label="Konfirmasi Password"
              name="konfirmasiPassword"
              show={showKonfirmasi}
              onToggle={() => setShowKonfirmasi((v) => !v)}
              error={errors.konfirmasiPassword}
              placeholder="Ulangi password"
            />

            <button
              type="submit"
              id="btn-daftar"
              disabled={loading}
              className="w-full mt-2 bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'MENDAFTAR...' : 'DAFTAR'}
            </button>

            <p className="text-center mt-5 text-sm text-gray-500">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                Masuk
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
