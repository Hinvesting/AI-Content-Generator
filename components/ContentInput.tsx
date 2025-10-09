
import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { MagicIcon } from './icons';

interface ContentInputProps {
  onProcessContent: (content: string) => void;
  disabled: boolean;
}

export const ContentInput: React.FC<ContentInputProps> = ({ onProcessContent, disabled }) => {
  const [inputType, setInputType] = useState<'paste' | 'upload'>('paste');
  const [text, setText] = useState('');

  const handleProcessText = () => {
    if (text.trim()) {
      onProcessContent(text);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8 bg-slate-800/50 ring-1 ring-white/10 rounded-lg shadow-2xl overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setInputType('paste')}
          className={`flex-1 p-4 font-semibold transition-colors rounded-tl-lg ${inputType === 'paste' ? 'bg-slate-800 text-blue-400' : 'text-gray-400 hover:bg-slate-700/50'}`}
          aria-pressed={inputType === 'paste'}
        >
          Paste Text
        </button>
        <button
          onClick={() => setInputType('upload')}
          className={`flex-1 p-4 font-semibold transition-colors rounded-tr-lg ${inputType === 'upload' ? 'bg-slate-800 text-blue-400' : 'text-gray-400 hover:bg-slate-700/50'}`}
          aria-pressed={inputType === 'upload'}
        >
          Upload File
        </button>
      </div>
      
      {/* Content */}
      <div className="p-6 bg-slate-800">
        {inputType === 'paste' && (
          <div className="flex flex-col animate-fade-in">
            <h2 className="text-lg font-bold mb-4 text-gray-200" id="paste-label">Paste Your Content</h2>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your formatted script or article here..."
              className="w-full flex-grow p-3 bg-slate-900 border border-slate-700 rounded-md text-sm focus:ring-2 focus:ring-blue-500 transition min-h-[300px] resize-y"
              disabled={disabled}
              aria-labelledby="paste-label"
            />
            <button
              onClick={handleProcessText}
              disabled={disabled || !text.trim()}
              className="mt-4 w-full flex items-center justify-center px-4 py-3 bg-brand-secondary text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <MagicIcon className="w-5 h-5 mr-2" />
              Process Text
            </button>
          </div>
        )}
        
        {inputType === 'upload' && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-bold mb-4 text-gray-200">Upload a Formatted File</h2>
            <FileUpload onFileUpload={onProcessContent} disabled={disabled} />
          </div>
        )}
      </div>
    </div>
  );
};
