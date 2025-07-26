import { api } from '../context/AuthContext';

export interface DashboardMetrics {
  totalUsers: number;
  totalQueries: number;
  totalPDFs: number;
  topQueries: Array<{ query: string; count: number }>;
  recentActivity: Array<{ query: string; timestamp: string; username: string }>;
}

export interface PDFDocument {
  filename: string;
  pages: number;
  uploadedAt: string;
  year?: string;
  semester?: string;
  subject?: string;
}

export interface User {
  username: string;
  email: string;
  role: string;
  mobile?: string;
  location?: string;
  github?: string;
  linkedin?: string;
  portfolio?: string;
  created_at?: string;
}

export const adminService = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      console.log('Fetching dashboard metrics...');
      const token = localStorage.getItem('access_token');
      console.log('Current token:', token ? 'Token exists' : 'No token found');
      
      const response = await api.get('/admin/metrics');
      console.log('Dashboard metrics response:', response.status);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error.response?.data || error.message);
      throw error;
    }
  },

  async getPDFs(): Promise<PDFDocument[]> {
    try {
      console.log('Fetching PDFs...');
      const response = await api.get('/admin/pdfs');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching PDFs:', error.response?.data || error.message);
      throw error;
    }
  },

  async uploadPDF(file: File, year: string, semester: string, subject: string): Promise<void> {
    try {
      console.log('Uploading PDF with metadata:', { year, semester, subject });
      const formData = new FormData();
      formData.append('file', file);
      formData.append('year', year);
      formData.append('semester', semester);
      formData.append('subject', subject);
      
      await api.post('/admin/pdfs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
    } catch (error: any) {
      console.error('Error uploading PDF:', error.response?.data || error.message);
      throw error;
    }
  },

  async deletePDF(filename: string): Promise<void> {
    try {
      console.log('Deleting PDF:', filename);
      await api.delete(`/admin/pdfs/${filename}`);
    } catch (error: any) {
      console.error('Error deleting PDF:', error.response?.data || error.message);
      throw error;
    }
  },

  async reprocessPDF(filename: string): Promise<void> {
    try {
      console.log('Reprocessing PDF:', filename);
      await api.post(`/admin/pdfs/${filename}/reprocess`);
    } catch (error: any) {
      console.error('Error reprocessing PDF:', error.response?.data || error.message);
      throw error;
    }
  },

  async getQueriesOverTime(): Promise<{ name: string; value: number }[]> {
    try {
      console.log('Fetching queries over time...');
      const response = await api.get('/admin/queries/time');
      return response.data;
    } catch (error: any) {
      console.error('Error fetching queries over time:', error.response?.data || error.message);
      throw error;
    }
  },

  async getAllUsers(): Promise<User[]> {
    try {
      console.log('Fetching all users...');
      const token = localStorage.getItem('access_token');
      console.log('Current token:', token ? 'Token exists' : 'No token found');
      
      const response = await api.get('/admin/users');
      console.log('Users fetched successfully:', response.status);
      console.log('Number of users:', response.data.length);
      return response.data;
    } catch (error: any) {
      console.error('Error fetching users:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        console.error('Authentication error - token may be invalid or expired');
      } else if (error.response?.status === 403) {
        console.error('Permission denied - user may not have admin role');
      } else if (error.response?.status === 500) {
        console.error('Server error:', error.response?.data?.detail);
      }
      throw error;
    }
  },
}; 