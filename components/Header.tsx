import React from 'react';
import { View } from '../App';
import { supabase } from '../services/supabaseClient';

interface HeaderProps {
    currentView: View;
    navigateTo: (view: View) => void;
}

const NavLink: React.FC<{
    view: View;
    currentView: View;
    navigateTo: (view: View) => void;
    children: React.ReactNode;
}> = ({ view, currentView, navigateTo, children }) => {
    const isActive = currentView === view;
    const baseClasses = "px-3 py-2 rounded-md text-sm font-medium transition-colors";
    const activeClasses = "bg-indigo-700 text-white";
    const inactiveClasses = "text-gray-300 hover:bg-indigo-500 hover:text-white";

    return (
        <a href="#" onClick={(e) => { e.preventDefault(); navigateTo(view); }} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
            {children}
        </a>
    );
};

const Header: React.FC<HeaderProps> = ({ currentView, navigateTo }) => {
  
  const handleLogout = async () => {
    await supabase?.auth.signOut();
  };

  return (
    <header className="bg-indigo-600 shadow-lg no-print">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                <h1 className="text-xl font-bold text-white">
                    Sriyantra Solutions
                </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-4">
                <NavLink view="dashboard" currentView={currentView} navigateTo={navigateTo}>Dashboard</NavLink>
                <NavLink view="customers" currentView={currentView} navigateTo={navigateTo}>Customers</NavLink>
                <NavLink view="products" currentView={currentView} navigateTo={navigateTo}>Products</NavLink>
                <NavLink view="settings" currentView={currentView} navigateTo={navigateTo}>Settings</NavLink>
                <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-indigo-500 hover:text-white"
                >
                    Logout
                </button>
            </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;