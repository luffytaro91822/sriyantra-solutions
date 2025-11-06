import React, { useState, useEffect } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from './services/supabaseClient';
import Header from './components/Header';
import Footer from './components/Footer';
import Dashboard from './components/Dashboard';
import InvoiceEditor from './components/InvoiceEditor';
import Customers from './components/Customers';
import Products from './components/Products';
import Settings from './components/Settings';
import AuthPage from './components/AuthPage';

export type View = 'dashboard' | 'editor' | 'customers' | 'products' | 'settings';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState<View>('dashboard');
    const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

    useEffect(() => {
        // If the Supabase client failed to initialize, don't attempt to use it.
        if (!supabase) {
            setLoading(false);
            return;
        }

        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setLoading(false);
        };

        getSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const navigateTo = (newView: View) => {
        setView(newView);
    };
    
    const handleEditInvoice = (id: string) => {
        setSelectedInvoiceId(id);
        setView('editor');
    };

    const handleAddNewInvoice = () => {
        setSelectedInvoiceId(null);
        setView('editor');
    };
    
    const handleCloseEditor = () => {
        setView('dashboard');
        setSelectedInvoiceId(null);
    };
    
    const renderContent = () => {
        switch(view) {
            case 'dashboard':
                return <Dashboard onAddNew={handleAddNewInvoice} onEdit={handleEditInvoice} />;
            case 'editor':
                return <InvoiceEditor invoiceId={selectedInvoiceId} onClose={handleCloseEditor} />;
            case 'customers':
                return <Customers />;
            case 'products':
                return <Products />;
            case 'settings':
                return <Settings />;
            default:
                return <Dashboard onAddNew={handleAddNewInvoice} onEdit={handleEditInvoice} />;
        }
    };
    
    // Render a clear error message if the Supabase client couldn't be created.
    if (!supabase) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-red-50 text-red-800">
                <div className="text-center p-8 bg-white rounded-lg shadow-lg border border-red-200">
                    <h1 className="text-2xl font-bold">Application Error</h1>
                    <p className="mt-2">Could not connect to the backend service.</p>
                    <p className="mt-1 text-sm text-gray-600">Please check your Supabase configuration and the browser console for more details.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">Loading...</div>;
    }

    if (!session) {
        return <AuthPage />;
    }

    return (
        <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-sans">
            <Header currentView={view} navigateTo={navigateTo} />
            <main className="flex-grow">
                {renderContent()}
            </main>
            <Footer />
        </div>
    );
};

export default App;