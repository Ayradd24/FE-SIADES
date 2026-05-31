import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoDesaImg from '../assets/logo-desa.png';
import api from '../lib/api';

/**
 * HALAMAN LUPA PASSWORD
 *
 * Alur:
 * 1. User memasukkan nomor HP yang terdaftar
 * 2. Klik "Kirim Kode OTP"
 * 3. Backend mengirim OTP via SMS ke nomor tersebut
 *
 * API Endpoint: POST /auth/forgot-password
 * Request body : { no_hp: string }
 * Response     : { message: string }
 *
 * Halaman ini BELUM disambungkan ke halaman lain.
 */

interface ForgotPasswordErrors {
  nomorHP?: string;
  nik?: string;
  general?: string;
}

const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [nomorHP, setNomorHP] = useState('');
  const [nik, setNik] = useState('');
  const [errors, setErrors] = useState<ForgotPasswordErrors>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const validate = (): boolean => {
    const newErrors: ForgotPasswordErrors = {};

    if (!nomorHP) {
      newErrors.nomorHP = 'Nomor HP tidak boleh kosong';
    } else if (!/^08\d{8,11}$/.test(nomorHP)) {
      newErrors.nomorHP = 'Format nomor HP tidak valid (contoh: 08xxxxxxxxxx)';
    }

    if (!nik) {
      newErrors.nik = 'NIK tidak boleh kosong';
    } else if (!/^\d{16}$/.test(nik)) {
      newErrors.nik = 'NIK harus 16 digit';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, ''); // hanya angka
    setNomorHP(sanitized);

    if (errors.nomorHP) {
      setErrors((prev) => ({ ...prev, nomorHP: undefined }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNik(sanitized);

    if (errors.nik) {
      setErrors((prev) => ({ ...prev, nik: undefined }));
    }
    if (successMessage) {
      setSuccessMessage('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const res = await api.post('/forgot-password', { no_telp: nomorHP, nik });
      navigate('/verifikasi-otp', {
        state: {
          nomorHP,
          nik,
          debugOtp: res.data?.data?.debug_otp ?? null,
        },
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 404) {
        setErrors({ general: 'Nomor HP tidak terdaftar dalam sistem.' });
      } else if (err.response?.status === 429) {
        setErrors({ general: err.response?.data?.message || 'Terlalu sering meminta OTP. Coba lagi sebentar.' });
      } else if (err.response?.status === 422) {
        setErrors({ general: 'Format nomor HP tidak valid.' });
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
      <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <img src={logoDesaImg} alt="Logo Desa Karangasem" className="w-14 h-14 object-contain" />
          <h1 className="text-2xl font-extrabold text-[#1e3a5f]">LUPA PASSWORD</h1>
        </div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full text-sm font-semibold transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Beranda
        </Link>
      </header>

      {/* Forgot Password Card */}
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
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-xl font-extrabold text-[#1e3a5f] mb-2 uppercase tracking-wide">
            Reset Password
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Masukkan nomor HP dan NIK yang terdaftar pada akun Anda. Kami akan mengirimkan kode OTP untuk verifikasi.
          </p>

          {/* General Error */}
          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {errors.general}
            </div>
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl text-green-600 text-sm text-center animate-fade-in">
              <div className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {successMessage}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* Nomor HP */}
            <div className="mb-6">
              <label htmlFor="nomorHP" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                Nomor HP
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <input
                  id="nomorHP"
                  name="nomorHP"
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  autoComplete="tel"
                  placeholder="Contoh: 08xxxxxxxxxx"
                  value={nomorHP}
                  onChange={handlePhoneChange}
                  className={`input-field pl-10 ${errors.nomorHP ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.nomorHP ? (
                  <p className="text-xs text-red-500">{errors.nomorHP}</p>
                ) : (
                  <span />
                )}
                <p
                  className={`text-xs ml-auto ${nomorHP.length >= 10 && nomorHP.length <= 13 ? 'text-green-500' : 'text-gray-400'
                    }`}
                >
                </p>
              </div>
            </div>

            {/* NIK */}
            <div className="mb-6">
              <label htmlFor="nik" className="block text-sm font-semibold text-[#1e3a5f] mb-2">
                NIK
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6h4m-7 4h10M7 14h6m-9 6h16a2 2 0 002-2V6a2 2 0 00-2-2H4a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <input
                  id="nik"
                  name="nik"
                  type="text"
                  inputMode="numeric"
                  maxLength={16}
                  autoComplete="off"
                  placeholder="Masukkan 16 digit NIK"
                  value={nik}
                  onChange={handleNikChange}
                  className={`input-field pl-10 ${errors.nik ? 'border-red-400 focus:ring-red-300' : ''}`}
                />
              </div>
              <div className="flex justify-between items-center mt-1">
                {errors.nik ? (
                  <p className="text-xs text-red-500">{errors.nik}</p>
                ) : (
                  <span />
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-kirim-otp"
              disabled={loading}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'MENGIRIM...' : 'KIRIM KODE OTP'}
            </button>

            {/* Back to Login link */}
            <p className="text-center mt-5 text-sm text-gray-500">
              Ingat password?{' '}
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

export default ForgotPasswordPage;
