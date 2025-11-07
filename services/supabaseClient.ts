import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Read credentials from environment variables.
// VITE_ prefix is required to expose these variables to the client-side code in frameworks like Vite, which Vercel supports.
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
    console.error("Fatal Error: Supabase credentials (VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY) are missing from your environment. The application cannot connect to the backend. Make sure you have a .env file set up correctly for local development, or have configured these environment variables in your deployment service (e.g., Vercel).");
}

export const supabase = supabaseSingleton;