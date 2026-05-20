import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import logoDesaImg from '../assets/logo-desa.png';
import api from '../lib/api';

/**
 * HALAMAN VERIFIKASI OTP
 *
 * Alur:
 * 1. User diarahkan dari halaman LupaPassword setelah OTP dikirim
 * 2. User memasukkan 6 digit kode OTP
 * 3. Jika OTP benar, diarahkan ke halaman GantiPassword
 *
 * API Endpoint: POST /auth/verify-otp
 * Request body : { no_hp: string, otp: string }
 * Response     : { message: string, reset_token: string }
 */

interface VerifyOTPErrors {
  otp?: string;
  general?: string;
}

const VerifikasiOTP: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { nomorHP = '', nik = '', debugOtp = null } = (location.state as {
    nomorHP?: string;
    nik?: string;
    debugOtp?: string | null;
  }) || {};

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [errors, setErrors] = useState<VerifyOTPErrors>({});
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  // Auto-focus first input on mount
  useEffect(() => {
    if (!nomorHP || !nik) {
      navigate('/lupa-password', { replace: true });
      return;
    }
    inputRefs.current[0]?.focus();
  }, [nomorHP, nik, navigate]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // hanya angka

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // ambil digit terakhir
    setOtp(newOtp);

    if (errors.otp || errors.general) {
      setErrors({});
    }

    // Auto focus ke input selanjutnya
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData.length === 0) return;

    const newOtp = [...otp];
    for (let i = 0; i < 6; i++) {
      newOtp[i] = pastedData[i] || '';
    }
    setOtp(newOtp);

    // Focus pada input terakhir yang terisi
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputRefs.current[lastFilledIndex]?.focus();
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setErrors({});

    try {
      await api.post('/forgot-password', { no_telp: nomorHP, nik });
      setCountdown(60);
      setCanResend(false);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 429) {
        setErrors({ general: err.response?.data?.message || 'Terlalu sering meminta OTP. Coba lagi nanti.' });
      } else {
        setErrors({ general: 'Gagal mengirim ulang OTP. Silakan coba lagi.' });
      }
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setErrors({ otp: 'Masukkan 6 digit kode OTP' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post('/verify-reset-otp', {
        no_telp: nomorHP,
        otp: otpString,
      });
      const resetToken = response.data?.data?.reset_token;
      navigate('/ganti-password', {
        state: { nomorHP, nik, resetToken },
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string }; status?: number } };
      if (err.response?.status === 400) {
        setErrors({ otp: 'Kode OTP tidak valid atau sudah kedaluwarsa.' });
      } else if (err.response?.status === 429) {
        setErrors({ general: err.response?.data?.message || 'Terlalu banyak percobaan OTP. Coba lagi nanti.' });
      } else if (err.response?.data?.message) {
        setErrors({ general: err.response.data.message });
      } else {
        setErrors({ general: 'Terjadi kesalahan. Silakan coba beberapa saat lagi.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const maskedPhone = nomorHP
    ? `${nomorHP.slice(0, 4)}****${nomorHP.slice(-3)}`
    : '08xx****xxx';

  return (
    <div className="min-h-screen bg-[#e8edf5] flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm px-8 py-4 flex items-center gap-4">
        <img src={logoDesaImg} alt="Logo Desa Karangasem" className="w-14 h-14 object-contain" />
        <h1 className="text-2xl font-extrabold text-[#1e3a5f]">VERIFIKASI OTP</h1>
      </header>

      {/* Back to Home */}
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


      {/* OTP Card */}
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          <h2 className="text-center text-xl font-extrabold text-[#1e3a5f] mb-2 uppercase tracking-wide">
            Masukkan Kode OTP
          </h2>
          <p className="text-center text-sm text-gray-500 mb-8">
            Kami telah mengirimkan kode verifikasi 6 digit ke nomor{' '}
            <span className="font-semibold text-[#1e3a5f]">{maskedPhone}</span>
          </p>
          {debugOtp && (
            <p className="text-center text-xs text-blue-500 mb-4">
              Dev OTP: <span className="font-semibold">{debugOtp}</span>
            </p>
          )}

          {/* General Error */}
          {errors.general && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {errors.general}
            </div>
          )}

          {/* OTP Error */}
          {errors.otp && (
            <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center animate-fade-in">
              {errors.otp}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate>
            {/* OTP Input Boxes */}
            <div className="flex justify-center gap-3 mb-8" onPaste={handlePaste}>
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => { inputRefs.current[index] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className={`w-12 h-14 text-center text-xl font-bold rounded-xl border-2 transition-all duration-200 outline-none
                    ${errors.otp
                      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      : digit
                        ? 'border-blue-400 bg-blue-50 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                        : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-200'
                    }
                    text-[#1e3a5f]`}
                  id={`otp-input-${index}`}
                />
              ))}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              id="btn-verifikasi-otp"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-blue-400 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-base transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && (
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {loading ? 'MEMVERIFIKASI...' : 'VERIFIKASI'}
            </button>

            {/* Resend OTP */}
            <div className="text-center mt-5">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendLoading}
                  className="text-blue-500 font-semibold hover:text-blue-700 transition-colors text-sm disabled:opacity-60"
                >
                  {resendLoading ? 'Mengirim ulang...' : 'Kirim Ulang Kode OTP'}
                </button>
              ) : (
                <p className="text-sm text-gray-500">
                  Kirim ulang kode dalam{' '}
                  <span className="font-semibold text-[#1e3a5f]">{countdown}</span> detik
                </p>
              )}
            </div>

            {/* Back to Login link */}
            {/* <p className="text-center mt-4 text-sm text-gray-500">
              Ingat password?{' '}
              <Link to="/login" className="text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                Masuk
              </Link>
            </p> */}
            {/* Tidak Menerima OTP? */}
            <p className="text-center mt-2 text-sm text-gray-500">
              Tidak menerima OTP?{' '}
              <Link to="/" className="text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                Hubungi Admin
              </Link>
            </p>
            <p className="text-center mt-2 text-sm text-gray-500">
              <Link to="/lupa-password" className="text-blue-500 font-semibold hover:text-blue-700 transition-colors">
                Ganti Nomor HP
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VerifikasiOTP;
