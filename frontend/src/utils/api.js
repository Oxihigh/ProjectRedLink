import { supabase } from './supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

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

  const res = await fetch(`${API_URL}${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || 'API Error');
  return data;
}
