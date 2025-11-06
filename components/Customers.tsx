import React, { useState, useEffect, useCallback } from 'react';
import { Customer } from '../types';
import * as customerService from '../services/customerService';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';

const CustomerForm: React.FC<{ customer: Partial<Customer> | null, onSave: (customer: Omit<Customer, 'id'> & { id?: string }) => void, onCancel: () => void }> = ({ customer, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', address: '', phone: '', gstin: '' });
    
    useEffect(() => {
        if(customer) setFormData({ name: customer.name || '', address: customer.address || '', phone: customer.phone || '', gstin: customer.gstin || '' });
    }, [customer]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: customer?.id, ...formData });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium">Name</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/></div>
            <div><label className="text-sm font-medium">Address</label><input required value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/></div>
            <div><label className="text-sm font-medium">Phone</label><input required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/></div>
            <div><label className="text-sm font-medium">GSTIN</label><input value={formData.gstin} onChange={e => setFormData({...formData, gstin: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/></div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md">Save Customer</button>
            </div>
        </form>
    );
};


const Customers: React.FC = () => {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
    const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
    
    const loadCustomers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await customerService.getCustomers();
            setCustomers(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch customers.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCustomers();
    }, [loadCustomers]);
    
    const handleSave = async (customer: Omit<Customer, 'id'> & { id?: string }) => {
        try {
            await customerService.saveCustomer(customer);
            loadCustomers();
            setIsModalOpen(false);
            setEditingCustomer(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save customer.";
            alert(message);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!deletingCustomerId) return;
        try {
            await customerService.deleteCustomer(deletingCustomerId);
            loadCustomers();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete customer.";
            alert(message);
        } finally {
            setDeletingCustomerId(null);
        }
    };

    return (
        <>
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Customers</h1>
                <button onClick={() => { setEditingCustomer(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">Add Customer</button>
            </div>
            
            {loading ? (
                <div className="text-center py-10">Loading customers...</div>
            ) : error ? (
                <div className="text-center py-10 text-red-500 bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
                    <h3 className="font-bold">An Error Occurred</h3>
                    <p>{error}</p>
                    <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">This may be due to a database schema mismatch or missing permissions. Please run the setup script in README.md to ensure your database is correctly configured.</p>
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Phone</th>
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">GSTIN</th>
                                <th className="relative px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {customers.map(c => (
                                <tr key={c.id}>
                                    <td className="px-6 py-4">{c.name}</td>
                                    <td className="px-6 py-4">{c.phone}</td>
                                    <td className="px-6 py-4">{c.gstin || 'N/A'}</td>
                                    <td className="px-6 py-4 text-right space-x-4">
                                        <button onClick={() => { setEditingCustomer(c); setIsModalOpen(true); }} className="text-indigo-600 font-semibold">Edit</button>
                                        <button onClick={() => setDeletingCustomerId(c.id)} className="text-red-600 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingCustomer ? "Edit Customer" : "Add Customer"}>
                <CustomerForm customer={editingCustomer} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
        <ConfirmationModal
            isOpen={!!deletingCustomerId}
            onClose={() => setDeletingCustomerId(null)}
            onConfirm={handleConfirmDelete}
            title="Confirm Deletion"
            message="Are you sure you want to delete this customer? Existing invoices will not be deleted but will no longer be linked to this customer."
        />
        </>
    );
};

export default Customers;