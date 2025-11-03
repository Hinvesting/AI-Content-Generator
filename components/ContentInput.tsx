
import React, { useState } from 'react';
import { FileUpload } from './FileUpload';
import { MagicIcon, UploadIcon } from './icons';

interface ContentInputProps {
  onProcessContent: (content: string) => void;
  onProcessPackage: (files: { script: string; visuals: string; metadata: string; branding: string }) => void;
  disabled: boolean;
}

const PackageFileUpload: React.FC<{
  label: string;
  file: File | undefined;
  onFileChange: (file: File | null) => void;
  accept?: string;
}> = ({ label, file, onFileChange, accept }) => {
  const id = `package-upload-${label.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>
      <div className="flex items-center">
        <label htmlFor={id} className="relative cursor-pointer bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2 px-4 rounded-md transition-colors text-sm">
          <span>Choose File</span>
          <input
            id={id}
            type="file"
            className="sr-only"
            accept={accept || ".txt,.md"}
            onChange={(e) => onFileChange(e.target.files ? e.target.files[0] : null)}
          />
        </label>
        {file && <span className="ml-4 text-sm text-gray-400 truncate" title={file.name}>{file.name}</span>}
        {!file && <span className="ml-4 text-sm text-gray-500">No file selected</span>}
      </div>
    </div>
  );
};


export const ContentInput: React.FC<ContentInputProps> = ({ onProcessContent, onProcessPackage, disabled }) => {
  const [inputType, setInputType] = useState<'paste' | 'upload' | 'package'>('paste');
  const [text, setText] = useState('');
  const [packageFiles, setPackageFiles] = useState<{
    script?: File;
    visuals?: File;
    metadata?: File;
    branding?: File;
  }>({});


  const handleProcessText = () => {
    if (text.trim()) {
      onProcessContent(text);
    }
  };

  const handleFileChange = (key: keyof typeof packageFiles, file: File | null) => {
    setPackageFiles(prev => ({ ...prev, [key]: file || undefined }));
  };

  const handleProcessPackage = async () => {
    const { script, visuals, metadata, branding } = packageFiles;
    if (!script || !visuals || !metadata || !branding) return;

    const readAsText = (file: File): Promise<string> => 
      new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    
    try {
        const fileContents = {
            script: await readAsText(script),
            visuals: await readAsText(visuals),
            metadata: await readAsText(metadata),
            branding: await readAsText(branding),
        };
        onProcessPackage(fileContents);
    } catch (err) {
        console.error("Error reading package files:", err);
        // You might want to show an error to the user here
    }
  };

  const allPackageFilesUploaded = Object.keys(packageFiles).length === 4 && Object.values(packageFiles).every(f => f);

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
          className={`flex-1 p-4 font-semibold transition-colors ${inputType === 'upload' ? 'bg-slate-800 text-blue-400' : 'text-gray-400 hover:bg-slate-700/50'}`}
          aria-pressed={inputType === 'upload'}
        >
          Upload File
        </button>
         <button
          onClick={() => setInputType('package')}
          className={`flex-1 p-4 font-semibold transition-colors rounded-tr-lg ${inputType === 'package' ? 'bg-slate-800 text-blue-400' : 'text-gray-400 hover:bg-slate-700/50'}`}
          aria-pressed={inputType === 'package'}
        >
          Video Package
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

        {inputType === 'package' && (
            <div className="animate-fade-in space-y-6">
                 <div>
                    <h2 className="text-lg font-bold text-gray-200">Upload Video Package</h2>
                    <p className="text-sm text-gray-400 mt-1">Upload all four .txt files to process the full video content package.</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-900/50 rounded-lg">
                    <PackageFileUpload label="Script File" file={packageFiles.script} onFileChange={(file) => handleFileChange('script', file)} />
                    <PackageFileUpload label="Visuals File" file={packageFiles.visuals} onFileChange={(file) => handleFileChange('visuals', file)} />
                    <PackageFileUpload label="Metadata File" file={packageFiles.metadata} onFileChange={(file) => handleFileChange('metadata', file)} />
                    <PackageFileUpload label="Branding File" file={packageFiles.branding} onFileChange={(file) => handleFileChange('branding', file)} />
                 </div>
                 <button
                    onClick={handleProcessPackage}
                    disabled={disabled || !allPackageFilesUploaded}
                    className="w-full flex items-center justify-center px-4 py-3 bg-brand-secondary text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-slate-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                    <MagicIcon className="w-5 h-5 mr-2" />
                    Process Package
                </button>
            </div>
        )}
      </div>
    </div>
  );
};