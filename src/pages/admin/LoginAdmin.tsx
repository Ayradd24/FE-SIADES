import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';
import logoDesaImg from '../../assets/logo-desa.png';

/**
 * HALAMAN LOGIN UNIVERSAL — digunakan oleh SEMUA user (warga & admin).
 *
 * Cara kerja:
 * - User mengisi email + password
 * - Backend menentukan role dari response (admin / user)
 * - Jika role === 'admin' → redirect ke /admin/dashboard
 * - Jika role === 'user'  → redirect ke /beranda (halaman warga)
 *
 * API Endpoint: POST /auth/login
 * Request body : { email: string, password: string }
 * Response     : { token: string, role: 'admin' | 'user', name?: string }
 *
 * LocalStorage keys yang disimpan:
 *   - siades_token  : JWT token
 *   - siades_role   : 'admin' | 'user'
 *   - siades_name   : nama user (opsional, jika dikembalikan BE)
 */

interface LoginForm {
  email: string;
  password: string;
}

interface LoginErrors {
  email?: string;
  password?: string;
  general?: string;
}

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' });
  const [errors, setErrors] = useState<LoginErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validate = (): boolean => {
    const newErrors: LoginErrors = {};
    if (!form.email) {
      newErrors.email = 'Email tidak boleh kosong';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format email tidak valid';
    }
    if (!form.password) {
      newErrors.password = 'Password tidak boleh kosong';
    } else if (form.password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errors[name as keyof LoginErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      // Endpoint universal — backend yang menentukan role
      const response = await api.post('/auth/login', {
        email: form.email,
        password: form.password,
      });

      const { token, role, name } = response.data;

      localStorage.setItem('siades_token', token);
      localStorage.setItem('siades_role', role || 'user');
      if (name) localStorage.setItem('siades_name', name);

      // Routing berdasarkan role dari backend
      if (role === 'admin' || role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/beranda');
      }
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 401 || err.response?.status === 400) {
        setErrors({ general: 'Email atau password salah. Silakan coba lagi.' });
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Terjadi kesalahan. Silakan coba beberapa saat lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8edf5] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <img src={logoDesaImg} alt="Logo Desa Karangasem" className="w-14 h-14 object-contain" />
        <h1 className="text-2xl font-extrabold text-[#1e3a5f]">MASUK SISTEM PORTAL DESA</h1>
      </header>

      {/* Back to home */}
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

      {/* Login Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-lg p-10">
          <h2 className="text-center text-xl font-extrabold text-[#1e3a5f] mb-8 uppercase tracking-wide">
            Masuk ke Akun Anda
          </h2>

          {/* General Error */}
          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Email */}
            <div className="mb-5">
              <label htmlFor="email" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="masukkan email anda"
                value={form.email}
                onChange={handleChange}
                className={`input-field ${errors.email ? 'border-red-400 focus:ring-red-300' : ''}`}
              />
              {errors.email && (
                <p className="mt-1 text-xs text-red-500">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="mb-7">
              <label htmlFor="password" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  className={`input-field pr-12 ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
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
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-masuk"
              disabled={loading}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'MASUK...' : 'MASUK'}
            </button>

            {/* Register Link */}
            <p className="text-center mt-5 text-sm text-gray-500">
              Belum punya akun?{' '}
              <Link to="/register" className="text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                Buat Akun
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
