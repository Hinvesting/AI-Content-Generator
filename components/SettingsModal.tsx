
import React from 'react';
import { AppSettings } from '../types';
import { CloseIcon } from './icons';
import { TONE_OPTIONS } from '../constants';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (newSettings: AppSettings) => void;
  onReset: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave, onReset }) => {
  const [localSettings, setLocalSettings] = React.useState<AppSettings>(settings);
  const [customTone, setCustomTone] = React.useState('');

  React.useEffect(() => {
    setLocalSettings(settings);
    if (!TONE_OPTIONS.includes(settings.tone)) {
      setCustomTone(settings.tone);
    } else {
      setCustomTone('');
    }
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    if (localSettings.tone === 'custom' && customTone) {
        onSave({...localSettings, tone: customTone});
    } else {
        onSave(localSettings);
    }
    onClose();
  };

  const handleToneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setLocalSettings(prev => ({ ...prev, tone: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity">
      <div className="bg-slate-800 rounded-lg shadow-2xl p-8 w-full max-w-md m-4 relative animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <CloseIcon className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold mb-6 text-white">Settings</h2>

        {/* Style Selector */}
        <div className="mb-4">
          <label htmlFor="style" className="block text-sm font-medium text-gray-300 mb-2">Image Style</label>
          <select
            id="style"
            value={localSettings.style}
            onChange={(e) => setLocalSettings({ ...localSettings, style: e.target.value as AppSettings['style'] })}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="photorealistic">Photorealistic</option>
            <option value="illustration">Illustration</option>
            <option value="cartoonish">Cartoonish</option>
          </select>
        </div>

        {/* Aspect Ratio */}
        <div className="mb-4">
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-300 mb-2">Aspect Ratio</label>
          <select
            id="aspectRatio"
            value={localSettings.aspectRatio}
            onChange={(e) => setLocalSettings({ ...localSettings, aspectRatio: e.target.value as AppSettings['aspectRatio'] })}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            <option value="16:9">16:9 (Landscape)</option>
            <option value="9:16">9:16 (Portrait)</option>
            <option value="1:1">1:1 (Square)</option>
            <option value="4:3">4:3 (Standard)</option>
            <option value="3:4">3:4 (Portrait)</option>
          </select>
        </div>

        {/* Tone */}
        <div className="mb-6">
          <label htmlFor="tone" className="block text-sm font-medium text-gray-300 mb-2">Tone</label>
          <select
            id="tone"
            value={TONE_OPTIONS.includes(localSettings.tone) ? localSettings.tone : 'custom'}
            onChange={handleToneChange}
            className="w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
          >
            {TONE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt.charAt(0).toUpperCase() + opt.slice(1)}</option>)}
            <option value="custom">Custom...</option>
          </select>
          {(localSettings.tone === 'custom' || !TONE_OPTIONS.includes(localSettings.tone)) && (
             <input
                type="text"
                value={customTone}
                onChange={(e) => setCustomTone(e.target.value)}
                placeholder="Enter custom tone"
                className="mt-2 w-full p-2 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
             />
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
            <button
                onClick={onReset}
                className="px-4 py-2 text-sm font-medium text-gray-300 bg-slate-700 rounded-md hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-red-500 transition"
            >
                Reset to Defaults
            </button>
            <button
                onClick={handleSave}
                className="px-6 py-2 font-semibold text-white bg-brand-secondary rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-blue-500 transition"
            >
                Save
            </button>
        </div>
      </div>
    </div>
  );
};
