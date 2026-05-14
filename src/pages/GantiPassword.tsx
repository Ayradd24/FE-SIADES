import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoDesaImg from '../assets/logo-desa.png';
import api from '../lib/api';

/**
 * HALAMAN GANTI PASSWORD
 *
 * Alur:
 * 1. User diarahkan dari halaman VerifikasiOTP setelah OTP terverifikasi
 * 2. User memasukkan password baru dan konfirmasi password
 * 3. Jika berhasil, diarahkan ke halaman Login
 *
 * API Endpoint: POST /auth/reset-password
 * Request body : { no_hp: string, reset_token: string, password: string, password_confirmation: string }
 * Response     : { message: string }
 */

interface ResetPasswordErrors {
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const GantiPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { nomorHP, resetToken } = (location.state as { nomorHP?: string; resetToken?: string }) || {};

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<ResetPasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!resetToken || !nomorHP) {
      navigate('/lupa-password', { replace: true });
    }
  }, [navigate, nomorHP, resetToken]);

  if (!resetToken || !nomorHP) return null;

  const validate = (): boolean => {
    const newErrors: ResetPasswordErrors = {};

    if (!password) {
      newErrors.password = 'Password baru tidak boleh kosong';
    } else if (password.length < 6) {
      newErrors.password = 'Password minimal 6 karakter';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Konfirmasi password tidak boleh kosong';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Password tidak cocok';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      await api.post('/reset-password', {
        reset_token: resetToken,
        password,
        password_confirmation: confirmPassword,
      });
      setSuccess(true);

      // Redirect ke login setelah 2 detik
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 400) {
        setErrors({ general: 'Token reset tidak valid. Silakan ulangi proses dari awal.' });
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Terjadi kesalahan. Silakan coba beberapa saat lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: '', color: '' };
    if (password.length < 6) return { level: 1, label: 'Lemah', color: 'bg-red-400' };
    if (password.length < 8) return { level: 2, label: 'Cukup', color: 'bg-yellow-400' };
    if (/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) return { level: 4, label: 'Kuat', color: 'bg-green-500' };
    return { level: 3, label: 'Baik', color: 'bg-blue-400' };
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-[#e8edf5] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <img src={logoDesaImg} alt="Logo Desa Karangasem" className="w-14 h-14 object-contain" />
        <h1 className="text-2xl font-extrabold text-[#1e3a5f]">GANTI PASSWORD</h1>
      </header>

     

      {/* Change Password Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="bg-white rounded-3xl shadow-lg w-full max-w-lg p-10">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-xl font-extrabold text-[#1e3a5f] mb-2 uppercase tracking-wide">
            Buat Password Baru
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Masukkan password baru Anda. Pastikan password mudah diingat namun sulit ditebak.
          </p>

          {/* Success Message */}
          {success && (
            <div className="mb-5 p-4 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm text-center animate-fade-in">
              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="font-semibold">Password berhasil diubah!</p>
                <p className="text-xs text-green-500">Anda akan diarahkan ke halaman login...</p>
              </div>
            </div>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {errors.general}
            </div>
          )}

          {!success && (
            <form onSubmit={handleSubmit} noValidate>
              {/* Password Baru */}
              <div className="mb-5">
                <label htmlFor="password" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                  Password Baru
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password baru"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: undefined }));
                    }}
                    className={`input-field pl-10 pr-12 ${errors.password ? 'border-red-400 focus:ring-red-300' : ''}`}
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

                {/* Password Strength Bar */}
                {password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                            i <= strength.level ? strength.color : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      strength.level <= 1 ? 'text-red-500' :
                      strength.level === 2 ? 'text-yellow-500' :
                      strength.level === 3 ? 'text-blue-500' :
                      'text-green-500'
                    }`}>
                      Kekuatan: {strength.label}
                    </p>
                  </div>
                )}
              </div>

              {/* Konfirmasi Password */}
              <div className="mb-7">
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                  Konfirmasi Password Baru
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Masukkan ulang password baru"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                    }}
                    className={`input-field pl-10 pr-12 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-300' : ''}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Toggle confirm password visibility"
                  >
                    {showConfirmPassword ? (
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>
                )}
                {/* Match indicator */}
                {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
                  <p className="mt-1 text-xs text-green-500 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Password cocok
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                id="btn-ganti-password"
                disabled={loading}
                className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                )}
                {loading ? 'MENYIMPAN...' : 'SIMPAN PASSWORD BARU'}
              </button>

              {/* Back to Login link */}
              <p className="text-center mt-5 text-sm text-gray-500">
                Ingat password?{' '}
                <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                  Masuk
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default GantiPassword;
