import React from 'react';
import { CloseIcon, LoadingSpinner } from './icons';

interface PexelsResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: { id: number; url: string }[];
  query: string;
  isLoading: boolean;
  error: string | null;
}

export const PexelsResultsModal: React.FC<PexelsResultsModalProps> = ({ isOpen, onClose, results, query, isLoading, error }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl p-6 w-full max-w-lg m-4 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors">
          <CloseIcon className="w-5 h-5" />
        </button>
        <h3 className="text-xl font-bold mb-4 text-white">Pexels Video Results for "{query}"</h3>
        
        <div className="max-h-80 overflow-y-auto pr-2">
            {isLoading ? (
                <div className="flex justify-center items-center h-24">
                    <LoadingSpinner className="w-8 h-8 text-blue-500" />
                </div>
            ) : error ? (
                <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md text-sm">
                    <p className="font-bold mb-1">Search Failed</p>
                    <p>{error}</p>
                 </div>
            ) : results.length > 0 ? (
            <ul className="space-y-2">
                {results.map(result => (
                <li key={result.id} className="bg-slate-700 p-2 rounded-md hover:bg-slate-600 transition-colors">
                    <a 
                    href={result.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-400 hover:text-blue-300 hover:underline break-all text-sm"
                    >
                    {result.url}
                    </a>
                </li>
                ))}
            </ul>
            ) : (
            <p className="text-center text-gray-400 h-24 flex items-center justify-center">No results found.</p>
            )}
        </div>
      </div>
    </div>
  );
};