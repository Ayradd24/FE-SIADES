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

  getImageData: async (id: number): Promise<string> => {
    const response = await api.get(`/admin/signatures/${id}/image`);
    return response.data.signature_data;
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
    const contentDisposition = response.headers['content-disposition'];
    let filename = `surat-${suratId}.pdf`;
    if (typeof contentDisposition === 'string') {
      const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
      const asciiMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
      const rawName = utf8Match?.[1] || asciiMatch?.[1];
      if (rawName) {
        filename = decodeURIComponent(rawName);
      }
    }
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
};

export default signatureService;
