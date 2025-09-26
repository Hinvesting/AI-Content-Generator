

import React, { useState, useEffect } from 'react';
import { ApiKeyName } from '../services/apiKeyService';

interface ApiKeyModalProps {
  isOpen: boolean;
  missingKeys: ApiKeyName[];
  // Fix: Per Gemini API guidelines, do not handle Gemini API key via UI.
  onSave: (keys: { pexels?: string }) => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, missingKeys, onSave }) => {
  const [pexelsKey, setPexelsKey] = useState('');

  useEffect(() => {
    // Reset fields when modal is re-opened
    if (isOpen) {
        setPexelsKey('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    // Fix: Per Gemini API guidelines, do not handle Gemini API key via UI.
    onSave({ pexels: pexelsKey });
  };

  const shouldShowPexels = missingKeys.includes('PEXELS');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-[100]">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4">
        <h2 className="text-2xl font-bold mb-4 text-white">API Key Required</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Please provide your API key to use the application. This key is only stored in your browser for this session and will be deleted when you close this tab.
        </p>

        {shouldShowPexels && (
            <div className="mb-6">
            <label htmlFor="pexels-key" className="block text-sm font-medium text-gray-300 mb-2">Pexels API Key</label>
            <input
                id="pexels-key"
                type="password"
                value={pexelsKey}
                onChange={(e) => setPexelsKey(e.target.value)}
                placeholder="Enter your Pexels API key"
                className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
            </div>
        )}
        
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            className="px-6 py-2 font-semibold text-white bg-brand-secondary rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition disabled:bg-slate-600"
            // Fix: Per Gemini API guidelines, do not handle Gemini API key via UI.
            disabled={ (shouldShowPexels && !pexelsKey) }
          >
            Save &amp; Continue
          </button>
        </div>
      </div>
    </div>
  );
};
