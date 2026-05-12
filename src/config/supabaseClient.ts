import { createClient } from '@supabase/supabase-js';

// Pastikan untuk membuat file .env di root project dan mengisi variabel berikut
// VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
// VITE_SUPABASE_ANON_KEY=<your-anon-key>

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://dummy.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key';

export const supabase = createClient(supabaseUrl, supabaseKey);
