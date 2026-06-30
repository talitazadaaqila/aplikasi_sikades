import { supabase } from '../config/supabaseClient';

const MOCK_SESSION_KEY = 'sikades_mock_session';

export const login = async (email: string, password: string) => {
  // Hardcoded fallback logic
  if (email === 'admin' || email === 'admin@desa.id') {
    if (password === 'admin123') {
      localStorage.setItem(MOCK_SESSION_KEY, 'admin');
      return { data: { user: { email: 'admin', role: 'admin' } }, error: null };
    }
    return { data: null, error: { message: 'Password admin salah!' } };
  }

  if (email === 'user') {
    if (password === 'user123') {
      localStorage.setItem(MOCK_SESSION_KEY, 'user');
      return { data: { user: { email: 'user', role: 'user' } }, error: null };
    }
    return { data: null, error: { message: 'Password user salah!' } };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const logout = async () => {
  localStorage.removeItem(MOCK_SESSION_KEY);
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const checkSession = async () => {
  const mockRole = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockRole) {
    return { session: { user: { email: mockRole, role: mockRole } }, error: null };
  }
  const { data, error } = await supabase.auth.getSession();
  return { session: data.session, error };
};

export const getCurrentUserRole = async (): Promise<string> => {
  const mockRole = localStorage.getItem(MOCK_SESSION_KEY);
  if (mockRole) return mockRole;
  const { data: { session } } = await supabase.auth.getSession();
  return (session?.user as { role?: string })?.role || 'admin';
};
