import React, { useState } from 'react';
import { CloseIcon, DownloadIcon } from './icons';

interface ImagePreviewModalProps {
  image: string;
  text?: string;
  downloadName: string;
  onClose: () => void;
}

const downloadImage = (base64Image: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64Image}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ image, text, downloadName, onClose }) => {
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-4xl m-4 relative animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-4 -right-4 text-white bg-slate-700 rounded-full p-2 hover:bg-slate-600 transition-colors z-10">
          <CloseIcon className="w-6 h-6" />
        </button>
        
        <div className="relative">
          <img src={`data:image/png;base64,${image}`} alt="Generated content preview" className="max-h-[80vh] w-auto mx-auto rounded-t-lg" />
          {showOverlay && text && (
            <div className="absolute inset-0 flex items-center justify-center p-8 pointer-events-none">
              <p 
                className="text-white text-4xl font-bold text-center drop-shadow-lg"
                style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.9)' }}
              >
                {text}
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-900 rounded-b-lg flex justify-center items-center gap-8">
            {text && (
                <label className="flex items-center gap-3 cursor-pointer">
                    <input 
                        type="checkbox"
                        checked={showOverlay}
                        onChange={() => setShowOverlay(!showOverlay)}
                        className="w-5 h-5 accent-blue-500 bg-slate-600 border-slate-500 rounded"
                    />
                    <span className="text-gray-300 select-none">Show text overlay</span>
                </label>
            )}
             <button
                onClick={() => downloadImage(image, downloadName)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-700 transition-colors"
            >
                <DownloadIcon className="w-5 h-5" />
                Download
            </button>
        </div>
      </div>
    </div>
  );
};