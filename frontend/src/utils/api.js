import { supabase } from './supabase';

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/$/, '');

export async function apiCall(endpoint, method = 'GET', body = null) {
  const headers = {};
  
  const { data: { session } } = await supabase.auth.getSession();
  if (session) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const options = { method, headers };
  
  if (body) {
    if (body instanceof FormData) {
      options.body = body;
      // DO NOT set Content-Type for FormData, the browser will set it automatically with the boundary
    } else {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(body);
    }
  }

  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let res;
  try {
    res = await fetch(`${API_URL}${formattedEndpoint}`, options);
  } catch (netErr) {
    throw new Error(`Failed to connect to backend API (${API_URL}). Please verify backend server status.`);
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    let errMsg = 'API Error';
    if (data.detail) {
      if (Array.isArray(data.detail)) {
        errMsg = data.detail.map(err => `${err.loc ? err.loc.join('.') : 'Error'}: ${err.msg}`).join(', ');
      } else if (typeof data.detail === 'string') {
        errMsg = data.detail;
      } else {
        errMsg = JSON.stringify(data.detail);
      }
    } else if (res.statusText) {
      errMsg = `Server error ${res.status}: ${res.statusText}`;
    }
    throw new Error(errMsg);
  }
  return data;
}
