/**
 * utils/api.js
 * Centralised API client using axios.
 */

import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 120000, // 2 min — AI analysis can take time
});

// ── Response interceptor for consistent error handling ──
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message =
      err.response?.data?.error ||
      err.message ||
      'An unexpected error occurred.';
    return Promise.reject(new Error(message));
  }
);

// ── Submit text for plagiarism check ───────────────────
export const submitText = (title, text) =>
  api.post('/submissions', { title, text });

// ── Submit file for plagiarism check ──────────────────
export const submitFile = (title, file, onUploadProgress) => {
  const form = new FormData();
  if (title) form.append('title', title);
  form.append('file', file);
  return api.post('/submissions', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress,
  });
};

// ── Get all submissions ────────────────────────────────
export const getSubmissions = (page = 1, limit = 10) =>
  api.get(`/submissions?page=${page}&limit=${limit}`);

// ── Get single submission ──────────────────────────────
export const getSubmission = (id) => api.get(`/submissions/${id}`);

// ── Delete submission ──────────────────────────────────
export const deleteSubmission = (id) => api.delete(`/submissions/${id}`);

// ── Get stats ─────────────────────────────────────────
export const getStats = () => api.get('/submissions/stats');

export default api;
