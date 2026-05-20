import React, { useState, useEffect, useCallback } from 'react';
import api, { BASE_URL } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ToastContainer from '../../components/ui/Toast';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Modal from '../../components/ui/Modal';
import { useToast } from '../../hooks/useToast';
import PdfPreviewModal from '../../components/modals/PdfPreviewModal';
import SignatureModal from '../../components/modals/SignatureModal';
import { useAuth } from '../../hooks/useAuth';
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

interface JenisSuratItem {
  id: number;
  nama: string;
  deskripsi?: string;
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
  const { role } = useAuth();
  const isSuperAdmin = role === 'super-admin';
  const [data, setData] = useState<PermohonanSurat[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'' | StatusSurat>('');
  const [page, setPage] = useState(1);
  const [totalData, setTotalData] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | number | null>(null);
  const [rejectTargetId, setRejectTargetId] = useState<string | number | null>(null);
  
  // Modal state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isSignOpen, setIsSignOpen] = useState(false);
  const [selectedSurat, setSelectedSurat] = useState<PermohonanSurat | null>(null);
  const [tempSignatureUrl, setTempSignatureUrl] = useState<string | null>(null);
  const [jenisSuratList, setJenisSuratList] = useState<JenisSuratItem[]>([]);
  const [newJenisSurat, setNewJenisSurat] = useState('');
  const [addingJenisSurat, setAddingJenisSurat] = useState(false);
  const [isJenisSuratModalOpen, setIsJenisSuratModalOpen] = useState(false);
  const [deleteJenisSuratTarget, setDeleteJenisSuratTarget] = useState<JenisSuratItem | null>(null);
  const [deletingJenisSuratId, setDeletingJenisSuratId] = useState<number | null>(null);

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

   
  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchJenisSurat = useCallback(async () => {
    try {
      const res = await api.get('/jenis-surat');
      setJenisSuratList(res.data ?? []);
    } catch {
      showToast('Gagal memuat daftar jenis surat', 'error');
    }
  }, [showToast]);

  useEffect(() => {
    fetchJenisSurat();
  }, [fetchJenisSurat]);

  const handleAction = async (id: string | number, action: 'approve' | 'reject', signedPdf?: Blob) => {
    setActionLoading(id);
    try {
      const endpoint = action === 'approve'
        ? `/admin/persetujuan-surat/${id}/approve`
        : `/admin/persetujuan-surat/${id}/reject`;
      
      const formData = new FormData();
      if (signedPdf) {
        formData.append('signed_pdf', signedPdf, 'signed_document.pdf');
      }

      if (action === 'approve') {
        await api.post(endpoint, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.patch(endpoint);
      }

      const label = action === 'approve' ? 'disetujui' : 'ditolak';
      showToast(`Permohonan surat berhasil ${label}`, 'success');
      fetchData();
    } catch (error: any) {
      showToast(`Gagal memproses permohonan: ${error.response?.data?.message || error.message}`, 'error');
    } finally {
      setActionLoading(null);
      setIsSignOpen(false);
      setIsPreviewOpen(false);
      setTempSignatureUrl(null);
    }
  };

  const handleConfirmSignature = (signatureDataUrl: string) => {
    setTempSignatureUrl(signatureDataUrl);
    setIsSignOpen(false);
    setIsPreviewOpen(true);
  };

  const handleFinalApprove = async (position: { x: number; y: number; page: number; scale: number }) => {
    if (!selectedSurat || !tempSignatureUrl) return;
    
    setActionLoading(selectedSurat.id);
    try {
      // 1. Fetch the original PDF
      const pdfUrl = selectedSurat.file_path 
        ? `${BASE_URL.replace(/\/api$/, '')}/storage/${selectedSurat.file_path}`
        : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';
      
      const response = await fetch(pdfUrl);
      if (!response.ok) throw new Error("Gagal mengambil file PDF");
      const existingPdfBytes = await response.arrayBuffer();

      // 2. Load the PDF with pdf-lib
      const pdfDoc = await PDFDocument.load(existingPdfBytes);
      const pages = pdfDoc.getPages();
      const targetPage = pages[position.page - 1] || pages[pages.length - 1];

      // 3. Embed the signature image
      let signatureImageBytes: ArrayBuffer;
      if (tempSignatureUrl.startsWith('data:')) {
        const base64 = tempSignatureUrl.split(',')[1];
        signatureImageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0)).buffer;
      } else {
        const sigResponse = await fetch(tempSignatureUrl);
        if (!sigResponse.ok) throw new Error("Gagal mengambil gambar tanda tangan");
        signatureImageBytes = await sigResponse.arrayBuffer();
      }

      const signatureImage = await pdfDoc.embedPng(signatureImageBytes);
      const signatureDims = signatureImage.scale(0.25 * position.scale); // Base 0.25 × user scale from resize controls

      // 4. Calculate Coordinates
      const { width: pdfWidth, height: pdfHeight } = targetPage.getSize();
      
      // pdf-lib origin is bottom-left
      // DOM relative position is top-left
      const x = position.x * pdfWidth;
      const y = pdfHeight - (position.y * pdfHeight) - (signatureDims.height);

      targetPage.drawImage(signatureImage, {
        x,
        y,
        width: signatureDims.width,
        height: signatureDims.height,
      });

      // 5. Save and Upload
      const pdfBytes = await pdfDoc.save();
      const signedBlob = new Blob([new Uint8Array(pdfBytes)], { type: 'application/pdf' });

      await handleAction(selectedSurat.id, 'approve', signedBlob);
      
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
      <div className="mb-6 flex items-center justify-between gap-3">
        <h1 className="text-3xl font-extrabold text-[#1e3a5f]">Persetujuan Surat</h1>
        <Button onClick={() => setIsJenisSuratModalOpen(true)}>Kelola Jenis Surat</Button>
      </div>

      <Modal
        isOpen={isJenisSuratModalOpen}
        onClose={() => {
          setIsJenisSuratModalOpen(false);
          setNewJenisSurat('');
        }}
        title="Kelola Jenis Surat"
      >
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            if (!newJenisSurat.trim()) return;
            setAddingJenisSurat(true);
            try {
              await api.post('/admin/jenis-surat', { nama: newJenisSurat.trim() });
              showToast('Jenis surat berhasil ditambahkan', 'success');
              setNewJenisSurat('');
              setIsJenisSuratModalOpen(false);
              fetchJenisSurat();
            } catch (error: any) {
              const message = error?.response?.data?.message || 'Gagal menambahkan jenis surat';
              showToast(String(message), 'error');
            } finally {
              setAddingJenisSurat(false);
            }
          }}
        >
          <div>
            <label className="block text-sm font-semibold text-[#1e3a5f] mb-2">Nama Jenis Surat</label>
            <input
              type="text"
              value={newJenisSurat}
              onChange={(e) => setNewJenisSurat(e.target.value)}
              placeholder="Contoh: Surat Keterangan Penghasilan"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none transition-all"
              autoFocus
            />
          </div>
          <div className="max-h-60 overflow-auto border border-gray-100 rounded-xl p-3">
            <p className="text-sm font-semibold text-[#1e3a5f] mb-2">Daftar Jenis Surat</p>
            {jenisSuratList.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada jenis surat aktif.</p>
            ) : (
              <div className="space-y-2">
                {jenisSuratList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium text-gray-700">{item.nama}</span>
                    <Button
                      type="button"
                      size="sm"
                      variant="danger"
                      disabled={deletingJenisSuratId === item.id}
                      onClick={() => setDeleteJenisSuratTarget(item)}
                    >
                      Hapus
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="pt-2 flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsJenisSuratModalOpen(false);
                setNewJenisSurat('');
              }}
            >
              Batal
            </Button>
            <Button type="submit" loading={addingJenisSurat} disabled={!newJenisSurat.trim()}>
              {addingJenisSurat ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={deleteJenisSuratTarget !== null}
        onClose={() => setDeleteJenisSuratTarget(null)}
        onConfirm={async () => {
          if (!deleteJenisSuratTarget) return;
          setDeletingJenisSuratId(deleteJenisSuratTarget.id);
          try {
            await api.delete(`/admin/jenis-surat/${deleteJenisSuratTarget.id}`);
            showToast('Jenis surat berhasil dihapus', 'success');
            setDeleteJenisSuratTarget(null);
            fetchJenisSurat();
          } catch (error: any) {
            const message = error?.response?.data?.message || 'Gagal menghapus jenis surat';
            showToast(String(message), 'error');
          } finally {
            setDeletingJenisSuratId(null);
          }
        }}
        loading={deleteJenisSuratTarget !== null && deletingJenisSuratId === deleteJenisSuratTarget.id}
        title="Hapus Jenis Surat"
        message={`Apakah Anda yakin ingin menghapus "${deleteJenisSuratTarget?.nama || ''}"?`}
        confirmLabel="Ya, Hapus"
        cancelLabel="Batal"
        confirmVariant="danger"
      />

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
                  <th 
                    key={h} 
                    className={`px-5 py-3 text-sm font-semibold whitespace-nowrap ${h === 'Aksi' ? 'text-center' : 'text-left'}`}
                    style={{ textAlign: h === 'Aksi' ? 'center' : 'left' }}
                  >
                    {h}
                  </th>
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
                    <td className="px-5 py-3 text-center">
                      <div className="w-full flex items-center justify-center gap-2">
                        {surat.status === 'PENDING' ? (
                          <>
                            {isSuperAdmin && (
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => setRejectTargetId(surat.id)}
                                loading={actionLoading === surat.id}
                              >
                                ✕ Tolak
                              </Button>
                            )}
                            <button 
                                onClick={() => {
                                  setSelectedSurat(surat);
                                  setIsPreviewOpen(true);
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-xs font-semibold transition-colors"
                              >
                                Detail
                              </button>
                              {isSuperAdmin && (
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
                              )}
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
        onClose={() => {
          setIsPreviewOpen(false);
          setTempSignatureUrl(null);
        }}
        title={`${tempSignatureUrl ? 'Posisikan Tanda Tangan' : 'Detail File'}: ${selectedSurat?.jenis_surat || 'Surat'}`}
        mode={tempSignatureUrl ? 'sign' : 'view'}
        signatureUrl={tempSignatureUrl}
        onApprove={handleFinalApprove}
        fileUrl={selectedSurat?.file_path 
          ? `${BASE_URL.replace(/\/api$/, '')}/storage/${selectedSurat.file_path}` 
          : 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'}
      />

      <SignatureModal
        isOpen={isSignOpen}
        onClose={() => setIsSignOpen(false)}
        title="Tanda Tangan Digital"
        onConfirm={handleConfirmSignature}
      />

      <ConfirmDialog
        isOpen={rejectTargetId !== null}
        onClose={() => setRejectTargetId(null)}
        onConfirm={() => {
          if (rejectTargetId !== null) {
            handleAction(rejectTargetId, 'reject');
          }
          setRejectTargetId(null);
        }}
        loading={typeof rejectTargetId !== 'undefined' && actionLoading === rejectTargetId}
        title="Tolak Surat"
        message="Apakah Anda yakin ingin menolak surat ini? Tindakan ini akan tercatat dan tidak bisa dibatalkan langsung."
        confirmLabel="Ya, Tolak"
        cancelLabel="Batal"
        confirmVariant="danger"
      />
    </div>
  );
};

export default PersetujuanSurat;
