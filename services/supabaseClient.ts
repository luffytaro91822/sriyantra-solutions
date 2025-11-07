import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Hardcoded credentials to fix connection issue in this environment.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseSingleton: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Fatal Error: Could not initialize Supabase client. Please check if the URL and Key are valid.", error);
        supabaseSingleton = null;
    }
} else {
    console.error("Fatal Error: Supabase credentials (URL or Key) are missing. The application cannot connect to the backend.");
}

export const supabase = supabaseSingleton;
