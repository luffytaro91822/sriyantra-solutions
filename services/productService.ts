import { Product } from '../types';
import { supabase } from './supabaseClient';


export const getProducts = async (): Promise<Product[]> => {
    if (!supabase) {
        console.warn("Supabase not initialized, returning empty products list.");
        return [];
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('user_id', user.id)
        .order('name', { ascending: true });

    if (error) {
        if (error.message.includes('user_id') && error.message.includes('does not exist')) {
            throw new Error("Database Schema Error: The 'products' table is missing the 'user_id' column. Please run the SQL script from README.md to update your database.");
        }
        const errorMessage = `Error fetching products: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    return data || [];
};

export const getProductById = async (id: string): Promise<Product | undefined> => {
    if (!supabase) {
        console.warn("Supabase not initialized, returning undefined for product.");
        return undefined;
    }
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();
    
    if (error) {
        const errorMessage = `Error fetching product by ID: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    return data || undefined;
};

export const saveProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'user_id'> & { id?: string }): Promise<Product> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to save a product.");
    
    const { id, ...rest } = productData;
    const payload = { ...rest, user_id: user.id };

    let savedData;
    let operationError;
    
    if (id) {
        // Update existing record
        const { data, error } = await supabase
            .from('products')
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
            .from('products')
            .insert(payload)
            .select()
            .single();
        savedData = data;
        operationError = error;
    }
    
    if (operationError) {
        const errorMessage = `Error saving product: ${operationError.message}`;
        console.error(errorMessage, operationError);
        throw new Error(errorMessage);
    }

    if (!savedData) {
        throw new Error("Product was not returned after saving.");
    }

    return savedData;
};

export const deleteProduct = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
        
    if (error) {
        const errorMessage = `Error deleting product: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
};