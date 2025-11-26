const rawBase = import.meta.env.VITE_API_URL || '';
const API_BASE = rawBase
  ? rawBase.replace(/\/$/, '') + (rawBase.endsWith('/api') ? '' : '/api')
  : 'http://localhost:4000/api';

export const setToken = (token: string | null) => {
  if (token) localStorage.setItem('auth_token', token);
  else localStorage.removeItem('auth_token');
};

export const getToken = () => localStorage.getItem('auth_token');

const authFetch = async (path: string, options: RequestInit = {}) => {
  const token = getToken();
  const headers: HeadersInit = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = `${API_BASE}${path}`;
  if (import.meta.env.DEV) console.debug('[apiClient] Request', options.method || 'GET', url);
  const res = await fetch(url, { ...options, headers });
  if (import.meta.env.DEV) console.debug('[apiClient] Response', res.status, res.statusText);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed with status ${res.status}`);
  }
  return await res.json();
};

export const login = async (email: string, password: string) => {
  return await authFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
};

export const register = async (email: string, password: string, fullName?: string) => {
  return await authFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, fullName }) });
};

export const me = async () => {
  return await authFetch('/auth/me');
};

export const fetchJobRole = async (id: string) => {
  return await authFetch(`/job-roles/${id}`);
};

export const listJobRoles = async () => {
  return await authFetch(`/job-roles`);
};

export const createSession = async (jobRoleId?: string, customJobId?: string) => {
  return await authFetch('/interview-sessions', { method: 'POST', body: JSON.stringify({ jobRoleId, customJobId }) });
};

export const updateSession = async (id: string, body: any) => {
  return await authFetch(`/interview-sessions/${id}`, { method: 'PATCH', body: JSON.stringify(body) });
};

export const getSession = async (id: string) => {
  return await authFetch(`/interview-sessions/${id}`);
};

export const analyzeResume = async (data: any) => {
  return await authFetch('/functions/analyze-resume', { method: 'POST', body: JSON.stringify(data) });
};

export const voiceInterview = async (data: any) => {
  return await authFetch('/functions/voice-interview', { method: 'POST', body: JSON.stringify(data) });
};

export const getProfile = async () => {
  return await authFetch('/profile/me');
};

export const updateCredits = async (credits: number) => {
  return await authFetch('/profile/credits', { method: 'PATCH', body: JSON.stringify({ credits }) });
};

export const createCustomJob = async (title: string, description: string, requirements: string[]) => {
  return await authFetch('/custom-job', { method: 'POST', body: JSON.stringify({ title, description, requirements }) });
};

export default { setToken, getToken, login, register, me, fetchJobRole, listJobRoles, createSession, updateSession, getSession, analyzeResume, voiceInterview, getProfile, updateCredits, createCustomJob };
