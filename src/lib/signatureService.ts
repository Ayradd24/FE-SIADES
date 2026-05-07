import api from './api';

export interface AdminSignature {
  id: number;
  admin_id: number;
  signature_name: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

const signatureService = {
  getAll: async (): Promise<AdminSignature[]> => {
    const response = await api.get('/admin/signatures');
    return response.data;
  },

  store: async (name: string, dataUrl: string): Promise<AdminSignature> => {
    const response = await api.post('/admin/signatures', {
      signature_name: name,
      signature_data: dataUrl,
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/signatures/${id}`);
  },

  approveWithSignature: async (suratId: number, position: any) => {
    const response = await api.post(`/admin/persetujuan-surat/${suratId}/approve`, {
      signature_position: position,
    });
    return response.data;
  },

  downloadSignedPdf: async (suratId: number) => {
    const response = await api.get(`/surats/${suratId}/download`, {
      responseType: 'blob',
    });
    
    // Create link and trigger download
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `surat-${suratId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default signatureService;
