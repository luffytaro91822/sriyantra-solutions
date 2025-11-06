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
        console.error("Error initializing Supabase client. Please check if the URL is valid.", error);
        supabaseSingleton = null;
    }
} else {
    // This case should not be reached with hardcoded values, but it's here for safety.
    console.error("Supabase credentials are not set.");
}

export const supabase = supabaseSingleton;