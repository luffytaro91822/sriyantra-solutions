
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">Generating Invoice...</p>
      <p className="text-sm text-gray-500 dark:text-gray-400">The AI is crunching the numbers.</p>
    </div>
  );
};

export default Loader;
