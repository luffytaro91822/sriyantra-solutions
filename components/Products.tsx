import React, { useState, useEffect, useCallback } from 'react';
import { Product } from '../types';
import * as productService from '../services/productService';
import Modal from './Modal';
import ConfirmationModal from './ConfirmationModal';

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);
};

const ProductForm: React.FC<{ product: Partial<Product> | null, onSave: (product: Omit<Product, 'id'> & { id?: string }) => void, onCancel: () => void }> = ({ product, onSave, onCancel }) => {
    const [formData, setFormData] = useState({ name: '', unit_price: 0 });
    
    useEffect(() => {
        if(product) setFormData({ name: product.name || '', unit_price: product.unit_price || 0 });
    }, [product]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ id: product?.id, ...formData, unit_price: Number(formData.unit_price) });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="text-sm font-medium">Product/Service Name</label><input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/></div>
            <div><label className="text-sm font-medium">Unit Price (INR)</label><input required type="number" step="0.01" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: Number(e.target.value)})} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700"/></div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border rounded-md">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md">Save Product</button>
            </div>
        </form>
    );
};

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
    
    const loadProducts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await productService.getProducts();
            setProducts(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to fetch products.");
        } finally {
            setLoading(false);
        }
    }, []);
    
    useEffect(() => { loadProducts(); }, [loadProducts]);

    const handleSave = async (product: Omit<Product, 'id'> & { id?: string }) => {
        try {
            await productService.saveProduct(product);
            loadProducts();
            setIsModalOpen(false);
            setEditingProduct(null);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to save product.";
            alert(message);
        }
    };
    
    const handleConfirmDelete = async () => {
        if (!deletingProductId) return;
        try {
            await productService.deleteProduct(deletingProductId);
            loadProducts();
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to delete product.";
            alert(message);
        } finally {
            setDeletingProductId(null);
        }
    };

    return (
        <>
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Products & Services</h1>
                <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md">Add Product</button>
            </div>
            
            {loading ? (
                <div className="text-center py-10">Loading products...</div>
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
                                <th className="px-6 py-3 text-left text-xs font-medium uppercase">Unit Price</th>
                                <th className="relative px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td className="px-6 py-4">{p.name}</td>
                                    <td className="px-6 py-4">{formatCurrency(p.unit_price)}</td>
                                    <td className="px-6 py-4 text-right space-x-4">
                                        <button onClick={() => { setEditingProduct(p); setIsModalOpen(true); }} className="text-indigo-600 font-semibold">Edit</button>
                                        <button onClick={() => setDeletingProductId(p.id)} className="text-red-600 font-semibold">Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}


            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Edit Product" : "Add Product"}>
                <ProductForm product={editingProduct} onSave={handleSave} onCancel={() => setIsModalOpen(false)} />
            </Modal>
        </div>
        <ConfirmationModal
            isOpen={!!deletingProductId}
            onClose={() => setDeletingProductId(null)}
            onConfirm={handleConfirmDelete}
            title="Confirm Deletion"
            message="Are you sure you want to delete this product? This action cannot be undone."
        />
        </>
    );
};

export default Products;