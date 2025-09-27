import React, { useState, useEffect } from 'react';
import { Scene } from '../types';
import { DownloadIcon, LoadingSpinner, MagicIcon, SearchIcon } from './icons';
import { PexelsResultsModal } from './PexelsResultsModal';

interface SceneCardProps {
  scene: Scene;
  onGenerate: (sceneNumber: number, prompt: string) => void;
  onUpdateScene: (sceneNumber: number, updatedScene: Partial<Scene>) => void;
  onPexelsSearch: (query: string) => Promise<{ id: number; url: string }[] | { error: string }>;
  generatedImage: string | null;
  isLoading: boolean;
  onPreviewRequest: (data: { image: string; text: string; downloadName: string }) => void;
}

const downloadImage = (base64Image: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64Image}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


export const SceneCard: React.FC<SceneCardProps> = ({ scene, onGenerate, onUpdateScene, onPexelsSearch, generatedImage, isLoading, onPreviewRequest }) => {
  const [localScene, setLocalScene] = useState<Scene>(scene);
  const [isPexelsModalOpen, setIsPexelsModalOpen] = useState(false);
  const [isSearchingPexels, setIsSearchingPexels] = useState(false);
  const [pexelsResults, setPexelsResults] = useState<{ id: number; url: string }[]>([]);
  const [pexelsError, setPexelsError] = useState<string | null>(null);


  useEffect(() => {
    setLocalScene(scene);
  }, [scene]);

  const handleGenerate = () => {
    // PRD: Generate / Regenerate Image auto-appends Text Overlay + Pexels Search to Background Prompt.
    const combinedPrompt = `${localScene.backgroundPrompt}. Text overlay: "${localScene.textOverlay}". Style hint from Pexels search: ${localScene.pexelsSearch}.`;
    onGenerate(localScene.sceneNumber, combinedPrompt);
  };
  
  const handleDownload = () => {
    if (generatedImage) {
      downloadImage(generatedImage, `scene_${localScene.sceneNumber}.png`);
    }
  };

  const handleInputChange = <K extends keyof Scene>(field: K, value: Scene[K]) => {
      const updatedScene = {...localScene, [field]: value };
      setLocalScene(updatedScene);
      onUpdateScene(localScene.sceneNumber, { [field]: value });
  };

  const handlePexelsSearch = async () => {
    if (!localScene.pexelsSearch) return;
    setIsPexelsModalOpen(true);
    setIsSearchingPexels(true);
    setPexelsError(null);
    
    const response = await onPexelsSearch(localScene.pexelsSearch);

    if ('error' in response) {
        setPexelsResults([]);
        setPexelsError(response.error);
    } else {
        setPexelsResults(response);
    }
    
    setIsSearchingPexels(false);
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 shadow-lg flex flex-col md:flex-row gap-4">
      <PexelsResultsModal
        isOpen={isPexelsModalOpen}
        onClose={() => setIsPexelsModalOpen(false)}
        results={pexelsResults}
        query={localScene.pexelsSearch}
        isLoading={isSearchingPexels}
        error={pexelsError}
      />
      <div className="flex-1 space-y-3">
        <h4 className="text-lg font-bold text-blue-400">Scene {localScene.sceneNumber}</h4>
        
        <div>
          <label className="text-xs font-semibold text-gray-400">Background Prompt</label>
          <textarea
            value={localScene.backgroundPrompt}
            onChange={(e) => handleInputChange('backgroundPrompt', e.target.value)}
            className="w-full p-2 mt-1 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            rows={2}
          />
        </div>
        
        <div>
          <label className="text-xs font-semibold text-gray-400">Text Overlay</label>
          <input
            type="text"
            value={localScene.textOverlay}
            onChange={(e) => handleInputChange('textOverlay', e.target.value)}
            className="w-full p-2 mt-1 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div>
          <label className="text-xs font-semibold text-gray-400">Pexels Search / Style Hint</label>
          <input
            type="text"
            value={localScene.pexelsSearch}
            onChange={(e) => handleInputChange('pexelsSearch', e.target.value)}
            className="w-full p-2 mt-1 bg-slate-700 border border-slate-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          />
        </div>

      </div>
      <div className="md:w-1/3 flex flex-col items-center justify-between gap-3">
        <div
            className={`w-full aspect-video bg-slate-700 rounded-md flex items-center justify-center overflow-hidden transition-shadow ${generatedImage && !isLoading ? 'cursor-pointer hover:shadow-lg hover:shadow-blue-500/20' : ''}`}
            onClick={() => generatedImage && !isLoading && onPreviewRequest({ 
                image: generatedImage, 
                text: localScene.textOverlay,
                downloadName: `scene_${localScene.sceneNumber}.png`
            })}
        >
            {isLoading ? (
                <div className="flex flex-col items-center text-gray-400">
                    <LoadingSpinner className="w-8 h-8 text-blue-500" />
                    <p className="text-sm mt-2">Generating...</p>
                </div>
            ) : generatedImage ? (
                <img src={`data:image/png;base64,${generatedImage}`} alt={`Generated for scene ${localScene.sceneNumber}`} className="w-full h-full object-cover" />
            ) : (
                <p className="text-gray-500 text-sm">Image will appear here</p>
            )}
        </div>
        <div className="w-full flex gap-2">
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <MagicIcon className="w-5 h-5 mr-2" />}
            {generatedImage ? 'Regenerate' : 'Generate'}
          </button>
           <button
                onClick={handlePexelsSearch}
                disabled={isSearchingPexels || !localScene.pexelsSearch}
                className="flex-shrink-0 p-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                title="Search Pexels for videos"
            >
                <SearchIcon className="w-5 h-5" />
            </button>
          {generatedImage && !isLoading && (
            <button
                onClick={handleDownload}
                className="flex-shrink-0 p-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors"
                 title="Download Image"
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};