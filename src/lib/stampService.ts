import api from './api';

export interface AdminStamp {
  id: number;
  admin_id: number;
  stamp_name: string;
  file_path: string;
  created_at: string;
  updated_at: string;
}

const stampService = {
  getAll: async (): Promise<AdminStamp[]> => {
    const response = await api.get('/admin/stamps');
    return response.data;
  },

  store: async (name: string, file: File): Promise<AdminStamp> => {
    const formData = new FormData();
    formData.append('stamp_name', name);
    formData.append('stamp_file', file);

    const response = await api.post('/admin/stamps', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  delete: async (id: number): Promise<void> => {
    await api.delete(`/admin/stamps/${id}`);
  },

  getImageData: async (id: number): Promise<string> => {
    const response = await api.get(`/admin/stamps/${id}/image`);
    return response.data.stamp_data;
  },
};

export default stampService;
