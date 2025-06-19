import { createClient } from '@supabase/supabase-js';

// Always use the correct environment variable names
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  // Don't leak keys to console in production!
  throw new Error("Missing Supabase environment variable. Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_KEY in your .env.local");
}

// Only log in development, never log keys in production!
if (process.env.NODE_ENV === 'development') {
  console.log('Supabase URL:', supabaseUrl);
  // console.log('Supabase KEY:', supabaseKey); // Don't log your key!
}

export const supabase = createClient(supabaseUrl, supabaseKey);