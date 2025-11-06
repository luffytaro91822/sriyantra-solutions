import React, { useState, useCallback, useEffect } from 'react';
import { Invoice, InvoiceFormData, Customer, Product, Company, InvoiceStatus } from '../types';
import { generateInvoiceJson } from '../services/geminiService';
import * as invoiceService from '../services/invoiceService';
import * as customerService from '../services/customerService';
import * as productService from '../services/productService';
import * as companyService from '../services/companyService';
import InvoicePreview from './InvoicePreview';
import Loader from './Loader';

interface InvoiceEditorProps {
    invoiceId?: string | null;
    onClose: () => void;
}

const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ invoiceId, onClose }) => {
    const [formData, setFormData] = useState<InvoiceFormData>({
        customer_id: null,
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
        items: [{ name: '', unit_price: '', quantity: '' }],
        gst_percent: 18,
        notes: 'Thank you for your business. Payment is due within 15 days.'
    });

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [company, setCompany] = useState<Company | null>(null);

    const [generatedInvoice, setGeneratedInvoice] = useState<Invoice | null>(null);
    const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
    const [isDataLoading, setIsDataLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const isEditing = !!invoiceId;

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                setIsDataLoading(true);
                setError(null);
                const [customersData, productsData, companyData] = await Promise.all([
                    customerService.getCustomers(),
                    productService.getProducts(),
                    companyService.getCompanyInfo()
                ]);
                setCustomers(customersData);
                setProducts(productsData);
                setCompany(companyData);

                if (invoiceId) {
                    const existingInvoice = await invoiceService.getInvoiceById(invoiceId);
                    if (existingInvoice) {
                        setFormData({
                            customer_id: existingInvoice.customer.id,
                            invoice_number: existingInvoice.invoice_number,
                            invoice_date: existingInvoice.invoice_date,
                            due_date: existingInvoice.due_date,
                            items: existingInvoice.items.map(i => ({...i})),
                            gst_percent: existingInvoice.gst_percent,
                            notes: existingInvoice.notes,
                        });
                        setGeneratedInvoice(existingInvoice);
                    }
                } else {
                    const nextInvNumber = await invoiceService.getNextInvoiceNumber();
                    setFormData(prev => ({ ...prev, invoice_number: nextInvNumber }));
                    setGeneratedInvoice(null);
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load necessary data.");
            } finally {
                setIsDataLoading(false);
            }
        };
        
        loadInitialData();
    }, [invoiceId]);

    const handleGenerateAndSave = useCallback(async () => {
        if (!formData.customer_id) {
            setError("Please select a customer.");
            return;
        }
        const selectedCustomer = customers.find(c => c.id === formData.customer_id);
        if (!selectedCustomer) {
             setError("Selected customer not found.");
             return;
        }

        setIsAiLoading(true);
        setError(null);
        try {
            const result = await generateInvoiceJson(
                selectedCustomer,
                formData.invoice_number,
                formData.invoice_date,
                formData.due_date,
                formData.items,
                formData.gst_percent,
                formData.notes
            );
            // The result from the AI service is now clean and includes customer_id.
            const invoiceToSave = { 
                ...result, 
                id: invoiceId || undefined, 
                status: generatedInvoice?.status || 'Unpaid',
            };
            const saved = await invoiceService.saveInvoice(invoiceToSave);
            setGeneratedInvoice(saved);
            setTimeout(() => {
                onClose();
            }, 1000); // Give user time to see the success
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred.');
        } finally {
            setIsAiLoading(false);
        }
    }, [formData, customers, invoiceId, onClose, generatedInvoice]);

    const handleItemChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        const items = [...formData.items];
        let item = { ...items[index]};

        if (name === 'product_id') {
            const product = products.find(p => p.id === value);
            if (product) {
                item = { ...item, name: product.name, unit_price: product.unit_price };
            }
        } else {
            item = { ...item, [name]: name === 'name' ? value : parseFloat(value) || '' };
        }
        
        items[index] = item;
        setFormData(prev => ({ ...prev, items }));
    };
    
    const addItem = () => setFormData(p => ({ ...p, items: [...p.items, { name: '', unit_price: '', quantity: '' }] }));
    const removeItem = (index: number) => setFormData(p => ({ ...p, items: p.items.filter((_, i) => i !== index) }));

    const handleStatusChange = async (status: InvoiceStatus) => {
        if (generatedInvoice) {
            try {
                setError(null);
                const updated = await invoiceService.updateInvoiceStatus(generatedInvoice.id, status);
                if (updated) setGeneratedInvoice(updated);
            } catch (err) {
                 setError(err instanceof Error ? err.message : "Failed to update status.");
            }
        }
    };

    if (isDataLoading) {
        return <div className="text-center p-10">Loading Editor...</div>
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div className="no-print space-y-4">
                    <button onClick={onClose} className="text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center space-x-2">
                        &larr; <span>Back to Dashboard</span>
                    </button>

                    <form onSubmit={(e) => { e.preventDefault(); handleGenerateAndSave(); }} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        {/* Form content remains largely the same */}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium">Customer</label>
                                <select name="customer_id" value={formData.customer_id || ''} onChange={e => setFormData(p => ({...p, customer_id: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700">
                                    <option value="" disabled>Select a customer</option>
                                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Invoice Number</label>
                                <input type="text" value={formData.invoice_number} onChange={e => setFormData(p=>({...p, invoice_number: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Invoice Date</label>
                                <input type="date" value={formData.invoice_date} onChange={e => setFormData(p=>({...p, invoice_date: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">Due Date</label>
                                <input type="date" value={formData.due_date} onChange={e => setFormData(p=>({...p, due_date: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                            </div>
                            <div>
                                <label className="block text-sm font-medium">GST (%)</label>
                                <input type="number" value={formData.gst_percent} onChange={e => setFormData(p=>({...p, gst_percent: e.target.value}))} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                            </div>
                        </div>
                        {/* Items */}
                        <div>
                            <h3 className="text-lg font-medium">Items</h3>
                            {formData.items.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-center mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded-md">
                                    <select name="product_id" onChange={e => handleItemChange(index, e)} className="col-span-4 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700">
                                        <option>Select a product</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                    <input type="text" name="name" placeholder="Or type name" value={item.name} onChange={e => handleItemChange(index, e)} className="col-span-4 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                                    <input type="number" step="0.01" name="unit_price" placeholder="Price" value={item.unit_price} onChange={e => handleItemChange(index, e)} className="col-span-2 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                                    <input type="number" name="quantity" placeholder="Qty" value={item.quantity} onChange={e => handleItemChange(index, e)} className="col-span-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/>
                                    <button type="button" onClick={() => removeItem(index)} disabled={formData.items.length <= 1} className="col-span-1 text-red-500 hover:text-red-700 disabled:opacity-50">&#10005;</button>
                                </div>
                            ))}
                            <button type="button" onClick={addItem} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">+ Add Item</button>
                        </div>
                        <div>
                           <label className="block text-sm font-medium">Notes</label>
                           <textarea value={formData.notes} onChange={e => setFormData(p=>({...p, notes: e.target.value}))} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"></textarea>
                        </div>
                        <button type="submit" disabled={isAiLoading} className="w-full flex justify-center py-2 px-4 rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400">
                          {isAiLoading ? 'Processing...' : (isEditing ? 'Update Invoice' : 'Generate & Save Invoice')}
                        </button>
                    </form>
                </div>
                <div className="sticky top-8 space-y-4">
                    {generatedInvoice && (
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex items-center justify-between no-print">
                            <h3 className="font-semibold">Invoice Status: <span className="font-bold">{generatedInvoice.status}</span></h3>
                            <div className="space-x-2">
                                <button onClick={() => handleStatusChange('Paid')} disabled={generatedInvoice.status === 'Paid'} className="px-4 py-1 text-sm text-white bg-green-600 rounded disabled:bg-gray-400">Mark as Paid</button>
                                <button onClick={() => handleStatusChange('Unpaid')} disabled={generatedInvoice.status === 'Unpaid' || generatedInvoice.status === 'Overdue'} className="px-4 py-1 text-sm text-white bg-yellow-600 rounded disabled:bg-gray-400">Mark as Unpaid</button>
                            </div>
                        </div>
                    )}
                    {isAiLoading && <Loader />}
                    {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md">{error}</div>}
                    {generatedInvoice && !isAiLoading && !error && company && <InvoicePreview invoice={generatedInvoice} company={company} onClose={onClose} />}
                    {!generatedInvoice && !isAiLoading && !error && (
                        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border">
                           <h3 className="text-sm font-medium">Invoice Preview</h3>
                           <p className="mt-1 text-sm text-gray-500">Your invoice will appear here after generation.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditor;