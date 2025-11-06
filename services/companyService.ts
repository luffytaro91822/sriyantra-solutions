import { Company } from '../types';
import { supabase } from './supabaseClient';

const DEFAULT_COMPANY_INFO: Omit<Company, 'id' | 'created_at' | 'user_id'> = {
    name: 'Sriyantra Solutions',
    address: '123 Tech Park, Bangalore, Karnataka 560001',
    phone: '+91 80 1234 5678',
    gstin: '29ABCDE1234F1Z5',
};

export const getCompanyInfo = async (): Promise<Company> => {
    if (!supabase) {
        console.warn("Could not fetch company info, supabase not initialized. Returning default.");
        return DEFAULT_COMPANY_INFO as Company;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        console.warn("User not logged in, returning default company info.");
        return DEFAULT_COMPANY_INFO as Company;
    }

    const { data, error } = await supabase
        .from('company_info')
        .select('*')
        .eq('user_id', user.id)
        .single();
    
    if (error) {
        if (error.message.includes('user_id') && error.message.includes('does not exist')) {
            throw new Error("Database Schema Error: The 'company_info' table is missing the 'user_id' column. Please run the SQL script from README.md to update your database.");
        }
        if (error.code !== 'PGRST116') { // PGRST116 (no rows) is expected for new users. Other errors are not.
             throw new Error(`Error fetching company info: ${error.message}`);
        }
    }
    
    if (!data) { // This handles new users (PGRST116 case)
        return { ...DEFAULT_COMPANY_INFO, user_id: user.id } as Company;
    }
    
    return data;
};

export const saveCompanyInfo = async (info: Company): Promise<Company> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to save company info.");

    const { created_at, id, ...rest } = info;
    const payload = { ...rest, user_id: user.id };

    // Check if company info already exists for this user to avoid upsert issues with RLS
    const { data: existingInfo, error: selectError } = await supabase
        .from('company_info')
        .select('id')
        .eq('user_id', user.id)
        .single();

    if (selectError && selectError.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine
        throw new Error(`Error checking for company info: ${selectError.message}`);
    }

    let savedData;
    let operationError;

    if (existingInfo) {
        // Update existing record
        const { data, error } = await supabase
            .from('company_info')
            .update(payload)
            .eq('user_id', user.id)
            .select()
            .single();
        savedData = data;
        operationError = error;
    } else {
        // Insert new record
        const { data, error } = await supabase
            .from('company_info')
            .insert(payload)
            .select()
            .single();
        savedData = data;
        operationError = error;
    }

    if (operationError) {
        const errorMessage = `Error saving company info: ${operationError.message}`;
        console.error(errorMessage, operationError);
        throw new Error(errorMessage);
    }

    if (!savedData) {
        throw new Error("Company info was not returned after saving.");
    }

    return savedData;
};