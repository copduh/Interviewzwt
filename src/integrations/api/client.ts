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
  if (import.meta.env.DEV) console.debug('[apiClient] Response', res.status, res.statusText, url);

  // If response is not OK, try to parse JSON, otherwise return raw text for better errors
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    try {
      const err = JSON.parse(text || '{}');
      throw new Error(err.message || `Request failed with status ${res.status}`);
    } catch (e) {
      // Not JSON — surface raw text (helps diagnose HTML error pages)
      const snippet = (text || '').slice(0, 1000);
      throw new Error(`Request failed with status ${res.status}: ${snippet}`);
    }
  }

  // Try to parse JSON, but if the server returned HTML or plain text, return that as an error
  const bodyText = await res.text().catch(() => '');
  try {
    return JSON.parse(bodyText || '{}');
  } catch (e) {
    // If parsing fails, return the raw text under a predictable key so callers can inspect it
    return { __rawText: bodyText };
  }
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

export const fetchCustomJob = async (id: string) => {
  return await authFetch(`/custom-job/${id}`);
};

export const listJobRoles = async () => {
  return await authFetch(`/job-roles`);
};

export const createSession = async (jobRoleId?: string, customJobId?: string) => {
  return await authFetch('/interview-sessions', { method: 'POST', body: JSON.stringify({ jobRoleId, customJobId }) });
};

export const createPayPalOrder = async (amount: number, credits: number, planName?: string) => {
  return await authFetch('/payments/create-order', { method: 'POST', body: JSON.stringify({ amount, credits, planName }) });
};

export const capturePayPalOrder = async (orderId: string) => {
  return await authFetch(`/payments/capture/${orderId}`, { method: 'POST' });
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

export const scoreInterview = async (data: any) => {
  return await authFetch('/functions/score-interview', { method: 'POST', body: JSON.stringify(data) });
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

export default { setToken, getToken, login, register, me, fetchJobRole, fetchCustomJob, listJobRoles, createSession, updateSession, getSession, analyzeResume, scoreInterview, voiceInterview, getProfile, updateCredits, createCustomJob, createPayPalOrder, capturePayPalOrder };
