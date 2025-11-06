import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Hardcoded credentials to fix connection issue in this environment.
// Read from secure environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseSingleton: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Error initializing Supabase client. Please check if the URL is valid.", error);
        supabaseSingleton = null;
    }
} else {
    // This case should not be reached with hardcoded values, but it's here for safety.
    console.error("Supabase credentials are not set.");
}

export const supabase = supabaseSingleton;
