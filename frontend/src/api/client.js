const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
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
    const networkError = new Error('সার্ভারের সাথে সংযোগ স্থাপন করা যায়নি। অনুগ্রহ করে নিশ্চিত করুন backend চালু আছে।');
    networkError.status = 0;
    throw networkError;
  }
}

export const api = {
  // 1. POST /classes
  createClass: (name, totalSeats) => 
    request('/classes', {
      method: 'POST',
      body: JSON.stringify({ name, totalSeats: Number(totalSeats) })
    }),

  // 2. GET /classes
  getClasses: () => 
    request('/classes'),

  // 3. GET /classes/{classId}
  getClass: (classId) => 
    request(`/classes/${classId}`),

  // 4. POST /classes/{classId}/holds
  createHold: (classId, studentId) => 
    request(`/classes/${classId}/holds`, {
      method: 'POST',
      headers: { 'X-Student-Id': studentId }
    }),

  // 5. GET /holds/{holdId}
  getHold: (holdId) => 
    request(`/holds/${holdId}`),

  // 6. POST /holds/{holdId}/confirm
  confirmHold: (holdId, studentId) => 
    request(`/holds/${holdId}/confirm`, {
      method: 'POST',
      headers: { 'X-Student-Id': studentId }
    }),

  // 7. DELETE /holds/{holdId}
  cancelHold: (holdId, studentId) => 
    request(`/holds/${holdId}`, {
      method: 'DELETE',
      headers: { 'X-Student-Id': studentId }
    }),

  // 8. GET /me/holds
  getMyHolds: (studentId) => 
    request('/me/holds', {
      headers: { 'X-Student-Id': studentId }
    })
};
