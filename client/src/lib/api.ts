import axios from 'axios';
import { Search } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'https://librarymanagementsystem-bl3g.onrender.com/api';
// const API_URL ='http://127.0.0.1:8000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const response = await axios.post(`${API_URL}/users/refresh-token/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('access_token', access);

        originalRequest.headers.Authorization = `Bearer ${access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authAPI = {
  register: (data: { username: string; email: string; password: string; role?: string }) =>
    api.post('/users/register/', data),
  login: (credentials: { email: string; password: string }) =>
    api.post('/users/login/', credentials),
  forgotPassword: (email: string) =>
    api.post('/users/forgot-password/', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/users/reset-password/', { token, new_password: password }),
  getProfile: () => api.get('/users/profile/'),
  updateProfile: (data: any) => api.put('/users/profile/update/', data),
};

// Books endpoints
export const booksAPI = {
  home:()=> api.get('/books/', ),
  list: (params?: any) => api.get('/books/search/', { params }),
  create: (data: any) => api.post('/books/create/', data),
  get: (bookId: string) => api.get(`/books/${bookId}/`),
  update: (bookId: string, data: any) => api.put(`/books/${bookId}/update/`, data),
  delete: (bookId: string) => api.delete(`/books/${bookId}/delete/`),
  libraryStats:()=>api.get('/library_stats/'),
  // Bulk upload endpoint
  bulkUpload: (formData: FormData) =>
    api.post('/admin/upload-books/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Upload progress endpoint
  uploadProgress: (taskId: string) =>
    api.get(`/admin/upload-progress/${taskId}/`),
};

// Book Copies endpoints
export const copiesAPI = {
  list: (params?: any) => api.get('/copies/', { params }),
  create: (data: any) => api.post('/copies/create/', data),
  get: (copyId: string) => api.get(`/copies/${copyId}/`),
  update: (copyId: string, data: any) => api.put(`/copies/${copyId}/update/`, data),
  delete: (copyId: string) => api.delete(`/copies/${copyId}/delete/`),
};

// Borrow endpoints
export const borrowAPI = {

  borrow: (data: { user_id: string; copy_id: string }) =>
    api.post('/borrow/create/', data),
 return: (data: {
    borrow_id: string;
    condition: string;
    remarks: string;
    fine_paid?: boolean;
  }) => api.put("/borrow/return/", data),
  list: (params?: any) => api.get('/borrow/records/', { params }),
  memberSummary: () => api.get('/borrow/member-summary/'),
  viewMemberSummary: (userIdentifier: string) =>
    api.get(`/borrow/member-summary/${userIdentifier}/`),
  calculateFine: (borrow_id: string) =>
    api.post("/borrow/calculate-fine/", { borrow_id }),
  search: (params: any) =>
    api.get("/borrow/search/", { params }),
borrowHistory: (params: { user_id?: string; page?: number; limit?: number }) =>
    api.get('/borrow/borrow-history/', { params }),


};

// Users endpoints (admin)
export const usersAPI = {
  search: (query: string) => api.get('/users/search/', { params: { q: query } }),
  list: () => api.get('/users/all-users/'),
   getUserProfile: (userId: string) => api.get(`/users/profile/${userId}/`),
  updateRole: (userId: string, role: string) =>
    api.patch(`/users/update-role/${userId}/`, { role }),
  delete: (userId: string) => api.delete(`/users/delete-user/`, { data: { user_id: userId } }),
   summary: () => api.get("/users/dashboard/summary/"),
};
