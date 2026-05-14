import React, { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import { authStorage } from '../../lib/authStorage';

interface FormState {
  username: string;
  password: string;
  passwordConfirmation: string;
}

interface FormErrors {
  username?: string;
  password?: string;
  passwordConfirmation?: string;
  general?: string;
}

const SetupAkunWarga: React.FC = () => {
  const navigate = useNavigate();
  const token = authStorage.getToken();
  const role = authStorage.getRole();
  const mustUpdateCredentials = authStorage.getMustUpdateCredentials();
  const isWarga = role === 'warga' || role === 'user';

  const [form, setForm] = useState<FormState>({
    username: '',
    password: '',
    passwordConfirmation: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  if (!token || !isWarga) {
    return <Navigate to="/login" replace />;
  }

  if (!mustUpdateCredentials) {
    return <Navigate to="/warga/dashboard" replace />;
  }

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.username.trim()) {
      nextErrors.username = 'Username baru wajib diisi.';
    } else if (/^\d{16}$/.test(form.username.trim())) {
      nextErrors.username = 'Username tidak boleh berupa NIK 16 digit.';
    }

    if (!form.password) {
      nextErrors.password = 'Password baru wajib diisi.';
    } else if (form.password.length < 8) {
      nextErrors.password = 'Password minimal 8 karakter.';
    } else if (!/[a-zA-Z]/.test(form.password)) {
      nextErrors.password = 'Password harus mengandung minimal 1 huruf.';
    } else if (!/[0-9]/.test(form.password)) {
      nextErrors.password = 'Password harus mengandung minimal 1 angka.';
    }

    if (!form.passwordConfirmation) {
      nextErrors.passwordConfirmation = 'Konfirmasi password wajib diisi.';
    } else if (form.password !== form.passwordConfirmation) {
      nextErrors.passwordConfirmation = 'Konfirmasi password tidak cocok.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    try {
      const res = await api.post('/warga/account/setup', {
        username: form.username.trim(),
        password: form.password,
        password_confirmation: form.passwordConfirmation,
      });

      const token = res.data?.token;
      const user = res.data?.user;
      const role = user?.roles?.[0] ?? authStorage.getRole() ?? 'warga';
      const name = user?.name ?? authStorage.getName() ?? 'Warga';

      if (token) {
        authStorage.setSession(token, role, name, false);
      } else {
        authStorage.setMustUpdateCredentials(false);
      }

      navigate('/warga/dashboard', { replace: true });
    } catch (error: unknown) {
      const err = error as { response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } } };
      const backendErrors = err.response?.data?.errors ?? {};
      setErrors({
        username: backendErrors.username?.[0],
        password: backendErrors.password?.[0],
        passwordConfirmation: backendErrors.password_confirmation?.[0],
        general: err.response?.data?.message || 'Gagal memperbarui akun. Silakan coba lagi.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#e8edf5] flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-lg w-full max-w-lg p-8">
        <h1 className="text-2xl font-extrabold text-[#1e3a5f] mb-2">Wajib Update Akun</h1>
        <p className="text-sm text-gray-600 mb-6">
          Demi keamanan, silakan ubah username dan password Anda terlebih dahulu.
          Gunakan username akun Anda, bukan NIK.
        </p>

        {errors.general && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
            {errors.general}
          </div>
        )}

        <form onSubmit={submit} noValidate className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Username Baru</label>
            <input
              value={form.username}
              onChange={(e) => setForm((prev) => ({ ...prev, username: e.target.value }))}
              className={`input-field ${errors.username ? 'border-red-400 focus:ring-red-300' : ''}`}
              placeholder="Masukkan username baru"
            />
            {errors.username && <p className="mt-1 text-xs text-red-500">{errors.username}</p>}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                className={`input-field pr-12 ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="Minimal 8 karakter, huruf + angka"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
            {form.password.length > 0 && (
              <div className="mt-2 px-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${form.password.length >= 8 ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className={`text-xs ${form.password.length >= 8 ? 'text-green-600' : 'text-gray-400'}`}>Minimal 8 karakter</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${/[a-zA-Z]/.test(form.password) ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className={`text-xs ${/[a-zA-Z]/.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>Mengandung huruf</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-block w-3 h-3 rounded-full ${/[0-9]/.test(form.password) ? 'bg-green-400' : 'bg-gray-300'}`} />
                  <span className={`text-xs ${/[0-9]/.test(form.password) ? 'text-green-600' : 'text-gray-400'}`}>Mengandung angka</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Konfirmasi Password Baru</label>
            <div className="relative">
              <input
                type={showPasswordConfirmation ? 'text' : 'password'}
                value={form.passwordConfirmation}
                onChange={(e) => setForm((prev) => ({ ...prev, passwordConfirmation: e.target.value }))}
                className={`input-field pr-12 ${errors.passwordConfirmation ? 'border-red-400 focus:ring-red-300' : ''}`}
                placeholder="Ulangi password baru"
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirmation((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                aria-label="Toggle confirm password visibility"
              >
                {showPasswordConfirmation ? (
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
            {errors.passwordConfirmation && <p className="mt-1 text-xs text-red-500">{errors.passwordConfirmation}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-xl font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Menyimpan...' : 'Simpan Perubahan Akun'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupAkunWarga;
