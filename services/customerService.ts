import { Customer } from '../types';
import { supabase } from './supabaseClient';

export const getCustomers = async (): Promise<Customer[]> => {
    if (!supabase) {
        console.warn("Supabase not initialized, returning empty customers list.");
        return [];
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });
        
    if (error) {
        if (error.message.includes('user_id') && error.message.includes('does not exist')) {
            throw new Error("Database Schema Error: The 'customers' table is missing the 'user_id' column. Please run the SQL script from README.md to update your database.");
        }
        const errorMessage = `Error fetching customers: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    return data || [];
};

export const getCustomerById = async (id: string): Promise<Customer | undefined> => {
    if (!supabase) {
        console.warn("Supabase not initialized, returning undefined for customer.");
        return undefined;
    }
    const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
        
    if (error) {
        const errorMessage = `Error fetching customer by ID: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    return data || undefined;
};

export const saveCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'user_id'> & { id?: string }): Promise<Customer> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to save a customer.");
    
    const { id, ...rest } = customerData;
    const payload = { ...rest, user_id: user.id };

    let savedData;
    let operationError;

    if (id) {
        // Update existing record
        const { data, error } = await supabase
            .from('customers')
            .update(payload)
            .eq('id', id)
            .eq('user_id', user.id) // Ensure user can only update their own records
            .select()
            .single();
        savedData = data;
        operationError = error;
    } else {
        // Insert new record
        const { data, error } = await supabase
            .from('customers')
            .insert(payload)
            .select()
            .single();
        savedData = data;
        operationError = error;
    }

    if (operationError) {
        const errorMessage = `Error saving customer: ${operationError.message}`;
        console.error(errorMessage, operationError);
        throw new Error(errorMessage);
    }
    
    if (!savedData) {
        throw new Error("Customer was not returned after saving.");
    }

    return savedData;
};


export const deleteCustomer = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);

    if (error) {
        const errorMessage = `Error deleting customer: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
};