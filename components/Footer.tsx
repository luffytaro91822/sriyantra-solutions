import React from 'react';

const Footer: React.FC = () => {
    return (
        <footer className="bg-white dark:bg-gray-800 shadow-inner mt-12 no-print">
            <div className="container mx-auto px-4 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                <p>&copy; {new Date().getFullYear()} Sriyantra Solutions. All rights reserved.</p>
                <p>Powered by Gemini and React</p>
            </div>
        </footer>
    );
};

export default Footer;