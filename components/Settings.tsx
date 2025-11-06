import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import * as companyService from '../services/companyService';

const Settings: React.FC = () => {
    const [companyInfo, setCompanyInfo] = useState<Company | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const fetchCompanyInfo = async () => {
            try {
                setLoading(true);
                setError(null);
                const info = await companyService.getCompanyInfo();
                setCompanyInfo(info);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Could not load company information.");
            } finally {
                setLoading(false);
            }
        };
        fetchCompanyInfo();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!companyInfo) return;
        const { name, value } = e.target;
        setCompanyInfo(prev => prev ? { ...prev, [name]: value } : null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyInfo) return;

        setSaving(true);
        setError(null);
        try {
            await companyService.saveCompanyInfo(companyInfo);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to save information.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="text-center p-10">Loading Settings...</div>;
    
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto">
                <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Company Information</h1>
                
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6">
                        <h3 className="font-bold">An Error Occurred</h3>
                        <p>{error}</p>
                    </div>
                )}

                {companyInfo ? (
                    <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium">Company Name</label>
                            <input type="text" name="name" id="name" value={companyInfo.name} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" />
                        </div>
                        <div>
                            <label htmlFor="address" className="block text-sm font-medium">Address</label>
                            <input type="text" name="address" id="address" value={companyInfo.address} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" />
                        </div>
                         <div>
                            <label htmlFor="phone" className="block text-sm font-medium">Phone Number</label>
                            <input type="text" name="phone" id="phone" value={companyInfo.phone} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" />
                        </div>
                        <div>
                            <label htmlFor="gstin" className="block text-sm font-medium">GSTIN</label>
                            <input type="text" name="gstin" id="gstin" value={companyInfo.gstin} onChange={handleChange} required className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-700" />
                        </div>
                        <div className="flex justify-end items-center">
                            {saved && <span className="text-green-600 mr-4">Saved successfully!</span>}
                            <button type="submit" disabled={saving} className="w-full md:w-auto flex justify-center py-2 px-6 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                                {saving ? 'Saving...' : 'Save Information'}
                            </button>
                        </div>
                    </form>
                ) : (
                    !loading && !error && <div className="text-center p-10">No company data found.</div>
                )}
            </div>
        </div>
    );
};

export default Settings;