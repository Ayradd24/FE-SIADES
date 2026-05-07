import React, { useState, useEffect, useCallback } from 'react';
import api, { BASE_URL } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import PdfPreviewModal from '../../components/modals/PdfPreviewModal';
import SignatureModal from '../../components/modals/SignatureModal';
import { PDFDocument } from 'pdf-lib';

type StatusSurat = 'PENDING' | 'DISETUJUI' | 'DITOLAK';

interface PermohonanSurat {
  id: string | number;
  nama_pemohon: string;
  jenis_surat: string;
  tanggal?: string;
  created_at: string;
  status: StatusSurat;
  keterangan?: string;
  file_path?: string;
}

const MOCK_DATA: PermohonanSurat[] = [
  { id: 1, nama_pemohon: 'Herman', jenis_surat: 'Surat Domisili', created_at: '2025-10-02', status: 'PENDING' },
  { id: 2, nama_pemohon: 'Adit', jenis_surat: 'Pengantar SKCK', created_at: '2025-10-07', status: 'PENDING' },
  { id: 3, nama_pemohon: 'Denis', jenis_surat: 'Pengantar SKCK', created_at: '2025-10-08', status: 'PENDING' },
  { id: 4, nama_pemohon: 'Sari', jenis_surat: 'Keterangan Domisili', created_at: '2025-10-01', status: 'DISETUJUI' },
  { id: 5, nama_pemohon: 'Budi', jenis_surat: 'Surat Tidak Mampu', created_at: '2025-09-28', status: 'DITOLAK' },
];

const ITEMS_PER_PAGE = 10;

const PersetujuanSurat: React.FC = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [data, setData] = useState<PermohonanSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'' | StatusSurat>('');
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  
  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<PermohonanSurat | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/persetujuan-surat', {
        params: { page, limit: ITEMS_PER_PAGE, status: filterStatus || undefined },
      });
      setData(res.data?.data || res.data);
      setTotalData(res.data?.total || res.data?.length || 0);
    } catch {
      const filtered = filterStatus ? MOCK_DATA.filter((d) => d.status === filterStatus) : MOCK_DATA;
      setData(filtered);
      setTotalData(filtered.length);
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAction = async (id: string | number, action: 'approve' | 'reject', signedPdf?: Blob) => {
    setActionLoading(id);
    console.log(`Starting ${action} for surat ${id}`, signedPdf ? 'with signed PDF' : 'without signed PDF');
    try {
      const endpoint = action === 'approve'
        ? `/admin/persetujuan-surat/${id}/approve`
        : `/admin/persetujuan-surat/${id}/reject`;
      
      const formData = new FormData();
      if (signedPdf) {
        formData.append('signed_pdf', signedPdf, 'signed_document.pdf');
      }

      if (action === 'approve') {
        const response = await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        console.log('Approve response:', response.data);
      } else {
        const response = await api.patch(endpoint);
        console.log('Reject response:', response.data);
      }

      const label = action === 'approve' ? 'disetujui' : 'ditolak';
      showToast(`Permohonan surat berhasil ${label}`, 'success');
      fetchData();
    } catch (error: any) {
      console.error(`${action} failed:`, error.response?.data || error.message);
      showToast(`Gagal memproses permohonan: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setActionLoading(null);
      setIsSignOpen(false);
    }
  };

  const handleSign = async (signatureDataUrl: string) => {
    if (!selectedSurat) return;
    
    console.log('Starting signature process for:', selectedSurat);
    setActionLoading(selectedSurat.id);
    try {
      // 1. Fetch the original PDF
      const storageBaseUrl = BASE_URL.replace(/\/api$/, '') + '/storage';
      const pdfUrl = selectedSurat.file_path 
        ? `/storage/${selectedSurat.file_path}`
        : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      
      console.log('Fetching PDF from:', pdfUrl);
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Gagal mengambil file PDF (${response.status}). Pastikan file tersedia di storage.`);
      }
      const existingPdfBytes = await response.arrayBuffer();
      console.log('PDF fetched, bytes size:', existingPdfBytes.byteLength);

      // 2. Load the PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const lastPage = pages[pages.length - 1];
      console.log('PDF loaded, total pages:', pages.length);

      // 3. Embed the signature image
      const signatureImage = await pdfDoc.embedPng(signatureDataUrl);
      const signatureDims = signatureImage.scale(0.3); // Scale down a bit more

      // 4. Draw the signature image at the bottom right
      // Positioning logic: Last page, bottom right
      const { width, height } = lastPage.getSize();
      lastPage.drawImage(signatureImage, {
        x: width - signatureDims.width - 70,
        y: 70,
        width: signatureDims.width,
        height: signatureDims.height,
      });
      console.log('Signature drawn on PDF');

      // 5. Save the PDF
      const pdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([pdfBytes], { type: 'application/pdf' });
      console.log('Signed PDF generated, blob size:', signedBlob.size);

      // 6. Send to backend
      await handleAction(selectedSurat.id, 'approve', signedBlob);
      
      // Optional: Auto download for admin to check
      try {
        const url = URL.createObjectURL(signedBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Surat_${selectedSurat.nama_pemohon}_Signed.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (dlError) {
        console.warn('Auto-download failed (non-critical):', dlError);
      }
      
    } catch (error: any) {
      console.error('Signing failed:', error);
      showToast(`Gagal memproses tanda tangan: ${error.message}`, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  const totalPages = Math.ceil(totalData / ITEMS_PER_PAGE);
  const startItem = (page - 1) * ITEMS_PER_PAGE + 1;
  const endItem = Math.min(page * ITEMS_PER_PAGE, totalData);

  const getStatusBadge = (status: StatusSurat) => {
    const map: Record<StatusSurat, { variant: 'pending' | 'approved' | 'rejected'; label: string }> = {
      PENDING: { variant: 'pending', label: 'Menunggu' },
      DISETUJUI: { variant: 'approved', label: 'Disetujui' },
      DITOLAK: { variant: 'rejected', label: 'Ditolak' },
    };
    const { variant, label } = map[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div>
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <h1 className="text-3xl font-extrabold text-[#1e3a5f] mb-6">Persetujuan Surat</h1>

      {/* Filter */}
      <div className="flex gap-3 mb-4">
        {(['', 'PENDING', 'DISETUJUI', 'DITOLAK'] as const).map((status) => (
          <button
            key={status}
            onClick={() => { setFilterStatus(status); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
              filterStatus === status
                ? 'bg-blue-400 text-white shadow-sm'
                : 'bg-white text-gray-600 hover:bg-blue-50 shadow-sm'
            }`}
          >
            {status === '' ? 'Semua' : status === 'PENDING' ? 'Menunggu' : status === 'DISETUJUI' ? 'Disetujui' : 'Ditolak'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-blue-400 text-white">
                {['No', 'Nama Pemohon', 'Jenis Surat', 'Tanggal', 'Aksi'].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-sm font-semibold whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="border-b border-gray-100 animate-pulse">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-5 py-3">
                        <div className="h-4 bg-gray-200 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-gray-400 text-sm">
                    Tidak ada permohonan surat
                  </td>
                </tr>
              ) : (
                data.map((surat, idx) => (
                  <tr key={surat.id} className="border-b border-gray-100 hover:bg-blue-50 transition-colors">
                    <td className="px-5 py-3 text-sm text-gray-600">{startItem + idx}</td>
                    <td className="px-5 py-3 text-sm font-medium text-gray-800">{surat.nama_pemohon}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{surat.jenis_surat}</td>
                    <td className="px-5 py-3 text-sm text-gray-600">{formatDate(surat.created_at)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        {surat.status === 'PENDING' ? (
                          <>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleAction(surat.id, 'reject')}
                              loading={actionLoading === surat.id}
                            >
                              ✕ Tolak
                            </Button>
                            <button 
                                onClick={() => {
                                  setSelectedSurat(surat);
                                  setIsPreviewOpen(true);
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Detail
                              </button>
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => {
                                  setSelectedSurat(surat);
                                  setIsSignOpen(true);
                                }}
                                loading={actionLoading === surat.id}
                              >
                                ✓ Setuju
                              </Button>
                          </>
                        ) : (
                          <>{getStatusBadge(surat.status)}</>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && data.length > 0 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Menampilkan <span className="font-semibold">{startItem}–{endItem}</span> dari <span className="font-semibold">{totalData}</span> data
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p - 1)} disabled={page === 1}>← Prev</Button>
              <span className="px-3 py-1 text-sm text-gray-600">{page} / {totalPages || 1}</span>
              <Button variant="secondary" size="sm" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next →</Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        title={`Detail File: ${selectedSurat?.jenis_surat || 'Surat'}`}
        fileUrl={selectedSurat?.file_path 
          ? `${BASE_URL.replace(/\/api$/, '')}/storage/${selectedSurat.file_path}` 
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
      />

      <SignatureModal
        isOpen={isSignOpen}
        onClose={() => setIsSignOpen(false)}
        title="Tanda Tangan Digital"
        onConfirm={handleSign}
      />
    </div>
  );
};

export default PersetujuanSurat;
