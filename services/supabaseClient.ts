import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Read credentials from environment variables.
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

let supabaseSingleton: SupabaseClient<Database> | null = null;

if (supabaseUrl && supabaseAnonKey) {
    try {
        supabaseSingleton = createClient<Database>(supabaseUrl, supabaseAnonKey);
    } catch (error) {
        console.error("Fatal Error: Could not initialize Supabase client. Please check if the URL and Key are valid.", error);
        supabaseSingleton = null;
    }
} else {
    console.error("Fatal Error: Supabase credentials (SUPABASE_URL or SUPABASE_ANON_KEY) are missing from your environment. The application cannot connect to the backend. Make sure you have a .env file set up correctly or have configured environment variables in your deployment service.");
}

export const supabase = supabaseSingleton;
