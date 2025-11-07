import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Read credentials from environment variables.
// The execution environment provides these variables via a global `process.env` object.
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabaseSingleton: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Fatal Error: Could not initialize Supabase client. Please check if the URL and Key are valid.", error);
        supabaseSingleton = null;
    }
} else {
    console.error("Fatal Error: Supabase credentials are missing. The application cannot connect to the backend. Please ensure you have set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables on your deployment platform (e.g., Vercel). For local development, create a '.env' file in the root of your project with these variables.");
}

export const supabase = supabaseSingleton;