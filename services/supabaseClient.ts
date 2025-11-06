import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types';

// Hardcoded credentials to fix connection issue in this environment.
const supabaseUrl = 'https://nmypemsgeyriovqjhqpi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5teXBlbXNnZXlyaW92cWpocXBpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0MjM3MTYsImV4cCI6MjA3Nzk5OTcxNn0.WytewD5p4lfTyTJ5i4LMMnWXADuWTQx__IkoDtVyS0s';

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