import React, { useState, useRef } from 'react';
import Button from '../../components/ui/Button';
import { useToast } from '../../hooks/useToast';

const PengajuanSurat: React.FC = () => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  
  const [form, setForm] = useState({
    jenisSurat: 'Surat Keterangan Usaha',
    keperluan: '',
  });

  // --- Handlers for Canvas Signature ---
  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Normalize coordinates for both mouse and touch
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // --- Form Handlers ---
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.keperluan) {
      showToast('Keperluan surat harus diisi', 'error');
      return;
    }

    setLoading(true);
    // Simulasi API call
    setTimeout(() => {
      setLoading(false);
      showToast('Pengajuan Surat berhasil dikirim', 'success');
      setForm({ jenisSurat: 'Surat Keterangan Usaha', keperluan: '' });
      clearSignature();
    }, 1500);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-blue-50">
        <h1 className="text-2xl font-bold text-[#1e3a5f] mb-2">Pengajuan Surat</h1>
        <p className="text-gray-500 mb-6">Silakan lengkapi formulir di bawah ini untuk mengajukan pembuatan surat.</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Jenis Surat</label>
            <select
              name="jenisSurat"
              value={form.jenisSurat}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            >
              <option value="Surat Keterangan Usaha">Surat Keterangan Usaha</option>
              <option value="Surat Keterangan Domisili">Surat Keterangan Domisili</option>
              <option value="Surat Keterangan Tidak Mampu">Surat Keterangan Tidak Mampu</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Keperluan</label>
            <textarea
              name="keperluan"
              rows={3}
              placeholder="Jelaskan keperluan pembuatan surat..."
              value={form.keperluan}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
            ></textarea>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Upload Dokumen Pendukung (KTP/KK)</label>
            <input 
              type="file" 
              className="block w-full text-sm text-gray-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-xl file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-50 file:text-blue-700
                hover:file:bg-blue-100 transition-all cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-sm font-semibold text-[#1e3a5f]">Tanda Tangan Digital</label>
              <button type="button" onClick={clearSignature} className="text-xs text-red-500 font-semibold hover:underline">Hapus</button>
            </div>
            <div className="border border-gray-300 rounded-xl overflow-hidden bg-gray-50">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                className="w-full h-[200px] cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Tanda tangan di dalam area kotak di atas.</p>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Mengirim...' : 'Kirim Pengajuan'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PengajuanSurat;
