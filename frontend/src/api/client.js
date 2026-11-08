import { mockApi } from './mockStore';

let isDemoMode = localStorage.getItem('school_demo_mode') === 'true';

export function setDemoMode(enabled) {
  isDemoMode = enabled;
  localStorage.setItem('school_demo_mode', enabled ? 'true' : 'false');
}

export function getDemoMode() {
  return isDemoMode;
}

export function getApiBase() {
  return localStorage.getItem('school_backend_url') 
    || import.meta.env.VITE_API_URL 
    || 'http://localhost:8080';
}

export function setApiBase(url) {
  if (url) {
    localStorage.setItem('school_backend_url', url.trim());
  } else {
    localStorage.removeItem('school_backend_url');
  }
}

async function request(path, options = {}) {
  const url = `${getApiBase()}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    
    if (response.status === 204) {
      return { success: true };
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = (typeof data === 'object' && data?.message) 
        ? data.message 
        : (typeof data === 'string' && data) 
          ? data 
          : `HTTP error ${response.status}: ${response.statusText}`;
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    if (err.status) {
      throw err;
    }
    const networkError = new Error(`Unable to connect to backend server at ${getApiBase()}. If testing in cloud (Vercel), switch to Demo Mode or run the backend via Docker.`);
    networkError.status = 0;
    throw networkError;
  }
}

export const api = {
  createClass: (name, totalSeats) => 
    isDemoMode ? mockApi.createClass(name, totalSeats) : request('/classes', {
      method: 'POST',
      body: JSON.stringify({ name, totalSeats: Number(totalSeats) })
    }),

  getClasses: () => 
    isDemoMode ? mockApi.getClasses() : request('/classes'),

  getClass: (classId) => 
    isDemoMode ? mockApi.getClass(classId) : request(`/classes/${classId}`),

  createHold: (classId, studentId) => 
    isDemoMode ? mockApi.createHold(classId, studentId) : request(`/classes/${classId}/holds`, {
      method: 'POST',
      headers: { 'X-Student-Id': studentId }
    }),

  getHold: (holdId) => 
    isDemoMode ? mockApi.getHold(holdId) : request(`/holds/${holdId}`),

  confirmHold: (holdId, studentId) => 
    isDemoMode ? mockApi.confirmHold(holdId, studentId) : request(`/holds/${holdId}/confirm`, {
      method: 'POST',
      headers: { 'X-Student-Id': studentId }
    }),

  cancelHold: (holdId, studentId) => 
    isDemoMode ? mockApi.cancelHold(holdId, studentId) : request(`/holds/${holdId}`, {
      method: 'DELETE',
      headers: { 'X-Student-Id': studentId }
    }),

  getMyHolds: (studentId) => 
    isDemoMode ? mockApi.getMyHolds(studentId) : request('/me/holds', {
      headers: { 'X-Student-Id': studentId }
    })
};
