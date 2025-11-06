import { Invoice, InvoiceStatus, Customer, InvoiceItem, Database } from '../types';
import { supabase } from './supabaseClient';

const getStatusFromDate = (dueDateStr: string): InvoiceStatus => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const dueDate = new Date(dueDateStr);
    
    if (dueDate < today) {
        return 'Overdue';
    }
    return 'Unpaid';
};

type RawInvoiceFromDB = Database['public']['Tables']['invoices']['Row'];

const combineInvoicesWithCustomers = async (rawInvoices: RawInvoiceFromDB[]): Promise<Invoice[]> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    if (!rawInvoices || rawInvoices.length === 0) return [];

    const customerIds = [...new Set(rawInvoices.map(inv => inv.customer_id))];
    const { data: customers, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .in('id', customerIds);

    if (customerError) {
        throw new Error(`Error fetching related customers: ${customerError.message}`);
    }

    const customerMap = new Map(customers.map((c: Customer) => [c.id, c]));

    return rawInvoices
        .map(inv => {
            const customer = customerMap.get(inv.customer_id);
            if (!customer) {
                console.warn(`Customer with ID ${inv.customer_id} not found for invoice ${inv.id}`);
                return null;
            }
            return { ...inv, items: inv.items as unknown as InvoiceItem[], customer };
        })
        .filter(Boolean) as Invoice[];
};

export const getInvoices = async (): Promise<Invoice[]> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];
    
    const { data, error } = await supabase
        .from('invoices')
        .select(`*`)
        .eq('user_id', user.id)
        .order('invoice_number', { ascending: false });
    
    if (error) {
        if (error.message.includes('user_id') && error.message.includes('does not exist')) {
            throw new Error("Database Schema Error: The 'invoices' table is missing the 'user_id' column. Please run the SQL script from README.md to update your database.");
        }
        const errorMessage = `Error fetching invoices: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    
    return await combineInvoicesWithCustomers(data || []);
};

export const getInvoiceById = async (id: string): Promise<Invoice | undefined> => {
    if (!supabase) {
        console.error(`Error fetching invoice ${id}: Supabase client not initialized.`);
        return undefined;
    }
    const { data: rawInvoice, error } = await supabase
        .from('invoices')
        .select(`*`)
        .eq('id', id)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return undefined; // Not an error, just not found
        const errorMessage = `Error fetching invoice ${id}: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    
    if (!rawInvoice) {
        return undefined;
    }

    const result = await combineInvoicesWithCustomers([rawInvoice]);
    return result[0];
};

export const saveInvoice = async (invoiceData: (Omit<Invoice, 'id' | 'status'> & { id?: string, status?: InvoiceStatus, client?: any })): Promise<Invoice> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be logged in to save an invoice.");

    // Prepare the payload for the database, stripping frontend-only fields
    const { id, customer, client, items, created_at, user_id, ...coreData } = invoiceData;

    const dbPayload = {
        ...coreData,
        items: items as any, // Supabase expects JSONB for items
        status: invoiceData.status || getStatusFromDate(invoiceData.due_date),
        user_id: user.id,
    };

    let savedRawInvoice;
    let operationError;

    if (id) {
        // Update existing invoice
        const { data, error } = await supabase
            .from('invoices')
            .update(dbPayload)
            .eq('id', id)
            .eq('user_id', user.id) // RLS also protects, but this is an extra layer
            .select(`*`)
            .single();
        savedRawInvoice = data;
        operationError = error;
    } else {
        // Insert new invoice
        const { data, error } = await supabase
            .from('invoices')
            .insert(dbPayload)
            .select(`*`)
            .single();
        savedRawInvoice = data;
        operationError = error;
    }
    
    if (operationError) {
        const errorMessage = `Error saving invoice: ${operationError.message}`;
        console.error(errorMessage, operationError);
        throw new Error(errorMessage);
    }
    
    if (!savedRawInvoice) {
        throw new Error("Invoice was not returned after saving.");
    }

    // Re-combine with customer data for the return type
    const result = await combineInvoicesWithCustomers([savedRawInvoice]);
    if (!result[0]) throw new Error("Could not find customer for the saved invoice.");
    return result[0];
};


export const deleteInvoice = async (id: string): Promise<void> => {
    if (!supabase) throw new Error("Supabase client not initialized.");
    const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);
    
    if (error) {
        const errorMessage = `Error deleting invoice: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
};

export const updateInvoiceStatus = async (id: string, status: InvoiceStatus): Promise<Invoice | undefined> => {
    if (!supabase) {
        console.error("Error updating status: Supabase client not initialized.");
        return undefined;
    }
    const { data: updatedRawInvoice, error } = await supabase
        .from('invoices')
        .update({ status })
        .eq('id', id)
        .select(`*`)
        .single();
    
    if (error) {
        const errorMessage = `Error updating invoice status: ${error.message}`;
        console.error(errorMessage, error);
        throw new Error(errorMessage);
    }
    
    if (!updatedRawInvoice) {
        console.warn(`Invoice with id ${id} not found for status update.`);
        return undefined;
    }

    const result = await combineInvoicesWithCustomers([updatedRawInvoice]);
    return result[0];
};

export const getNextInvoiceNumber = async (): Promise<string> => {
    const currentYear = new Date().getFullYear();
    
    if (!supabase) {
        console.warn("Supabase not initialized, returning default invoice number.");
        return `INV-${currentYear}-001`;
    }
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return `INV-${currentYear}-001`;

    const { data, error } = await supabase
        .from('invoices')
        .select('invoice_number')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();


    if (error || !data) {
        if (error && error.code !== 'PGRST116') { // PGRST116 means no rows found, which is fine.
             console.warn(`Could not fetch next invoice number: ${error.message}. Starting from 001.`);
        }
        return `INV-${currentYear}-001`;
    }

    const lastNumStr = data.invoice_number.split('-').pop();
    const lastNum = lastNumStr ? parseInt(lastNumStr, 10) : 0;
    const nextNum = (lastNum + 1).toString().padStart(3, '0');
    
    return `INV-${currentYear}-${nextNum}`;
};