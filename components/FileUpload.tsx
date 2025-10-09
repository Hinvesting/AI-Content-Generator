
import React from 'react';
import { UploadIcon } from './icons';

interface FileUploadProps {
  onFileUpload: (content: string) => void;
  disabled: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload, disabled }) => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        onFileUpload(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <label
      htmlFor="file-upload"
      className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors
      ${disabled 
        ? 'bg-gray-700 border-gray-600 text-gray-500'
        : 'bg-slate-800 border-slate-600 hover:bg-slate-700 hover:border-blue-500'}`
      }
    >
      <div className="flex flex-col items-center justify-center pt-5 pb-6">
        <UploadIcon className="w-10 h-10 mb-3 text-gray-400" />
        <p className="mb-2 text-sm text-gray-400">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">Plain text document (.txt)</p>
      </div>
      <input 
        id="file-upload" 
        type="file" 
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
        onChange={handleFileChange} 
        accept=".txt, .md"
        disabled={disabled}
      />
    </label>
  );
};
