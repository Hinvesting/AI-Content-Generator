

import React, { useState, useEffect, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { SettingsModal } from './components/SettingsModal';
import { SceneCard } from './components/SceneCard';
import { parseDocument } from './services/parsingService';
import { generateImage, MISSING_GEMINI_KEY_ERROR, generateFeaturedImagePrompt, extractKeywords } from './services/geminiService';
import * as storage from './services/storageService';
import { AppSettings, ParsedDocument, DocType, Scene, GeneratedImages, LoadingStates, VisualCue } from './types';
import { DEFAULT_SETTINGS } from './constants';
import { SettingsIcon, DownloadIcon, LoadingSpinner, MagicIcon, TrashIcon, SearchIcon } from './components/icons';
import { ImagePreviewModal } from './components/ImagePreviewModal';
import { ApiKeyModal } from './components/ApiKeyModal';
import * as apiKeyService from './services/apiKeyService';
// Fix: Corrected typo in constant name from MISSING_PEXels_KEY_ERROR to MISSING_PEXELS_KEY_ERROR.
import { searchPexelsVideos, MISSING_PEXELS_KEY_ERROR } from './services/pexelsService';
import { VisualCueCard } from './components/VisualCueCard';
import { PexelsResultsModal } from './components/PexelsResultsModal';


const downloadImage = (base64Image: string, fileName: string) => {
  const link = document.createElement('a');
  link.href = `data:image/png;base64,${base64Image}`;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const App: React.FC = () => {
  const [parsedDoc, setParsedDoc] = useState<ParsedDocument | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<GeneratedImages>({});
  const [loading, setLoading] = useState<LoadingStates>({});
  const [error, setError] = useState<string | null>(null);
  const [previewingImage, setPreviewingImage] = useState<{ image: string; text?: string; downloadName: string } | null>(null);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [missingApiKeys, setMissingApiKeys] = useState<apiKeyService.ApiKeyName[]>([]);
  
  const [isBlogPexelsModalOpen, setIsBlogPexelsModalOpen] = useState(false);
  const [isBlogSearchingPexels, setIsBlogSearchingPexels] = useState(false);
  const [blogPexelsResults, setBlogPexelsResults] = useState<{ id: number; url: string }[]>([]);
  const [blogPexelsError, setBlogPexelsError] = useState<string | null>(null);
  const [blogPexelsQuery, setBlogPexelsQuery] = useState('');

  const promptForApiKeys = useCallback((keys: apiKeyService.ApiKeyName[]) => {
    if (keys.length > 0) {
        setMissingApiKeys(keys);
        setIsApiKeyModalOpen(true);
    }
  }, []);

  useEffect(() => {
    const loadedSettings = storage.loadSettingsFromLocalStorage();
    const loadedImages = storage.loadImagesFromLocalStorage();
    const loadedDoc = storage.loadDocumentFromLocalStorage();
    if (loadedSettings) setSettings(loadedSettings);
    if (loadedImages) setGeneratedImages(loadedImages);
    if (loadedDoc) setParsedDoc(loadedDoc);
    
    // On initial load, check if keys are missing from session or env.
    setTimeout(() => {
        const missing = apiKeyService.getMissingKeys();
        promptForApiKeys(missing);
    }, 100);

  }, [promptForApiKeys]);

  const handleFileUpload = (content: string) => {
    handleClearAll();
    try {
      const doc = parseDocument(content);
      setParsedDoc(doc);
      storage.saveDocumentToLocalStorage(doc);
      setError(null);
    } catch (e) {
      console.error("Parsing error:", e);
      setError("Failed to parse document. Please check the format.");
    }
  };
  
  const handleSaveApiKeys = (keys: { gemini?: string; pexels?: string }) => {
    if (keys.gemini) {
        apiKeyService.saveApiKey('GEMINI', keys.gemini);
    }
    if (keys.pexels) {
        apiKeyService.saveApiKey('PEXELS', keys.pexels);
    }
    setIsApiKeyModalOpen(false);
    setMissingApiKeys([]);
    setError(null); // Clear previous key-related errors
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storage.saveSettingsToLocalStorage(newSettings);
  };
  
  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    storage.saveSettingsToLocalStorage(DEFAULT_SETTINGS);
    setIsSettingsOpen(false);
  }

  const handleGenerate = useCallback(async (key: string, prompt: string, imageSettings: AppSettings) => {
    setLoading(prev => ({ ...prev, [key]: true }));
    setError(null);
    try {
      const base64Image = await generateImage(prompt, imageSettings);
      setGeneratedImages(prev => {
        const newImages = { ...prev, [key]: base64Image };
        storage.saveImagesToLocalStorage(newImages);
        return newImages;
      });
    } catch (e) {
      if (e instanceof Error && e.message === MISSING_GEMINI_KEY_ERROR) {
        promptForApiKeys(['GEMINI']);
        setError("Your Gemini API key is missing or invalid. Please provide it.");
      } else {
        console.error(e);
        setError(`Failed to generate image for ${key}. Please try again.`);
      }
    } finally {
      setLoading(prev => ({ ...prev, [key]: false }));
    }
  }, [promptForApiKeys]);

  const handleGenerateScene = (sceneNumber: number, prompt: string) => {
    handleGenerate(`scene-${sceneNumber}`, prompt, settings);
  }
  
  const handleGenerateVisualCue = (cueIndex: number, prompt: string) => {
    // Fix: Explicitly type cueSettings to prevent type widening on aspectRatio.
    const cueSettings: AppSettings = {...settings, aspectRatio: '16:9'}; // Podcast visuals are likely 16:9
    handleGenerate(`cue-${cueIndex}`, prompt, cueSettings);
  }

  const handleGenerateTransparent = () => {
    if (parsedDoc?.transparentImagePrompt) {
      const transparentSettings: AppSettings = { ...settings, style: 'illustration', aspectRatio: '1:1' };
      handleGenerate('transparent', parsedDoc.transparentImagePrompt, transparentSettings);
    }
  }

  const handleGenerateFeaturedImage = async () => {
    if (!parsedDoc) return;
    const key = 'featured-image';
    setLoading(prev => ({ ...prev, [key]: true }));
    setError(null);
    try {
        const prompt = await generateFeaturedImagePrompt(parsedDoc.rawContent);
        // Using 16:9 for featured images, which is a common ratio
        await handleGenerate(key, prompt, { ...settings, aspectRatio: '16:9' });
    } catch (e) {
        if (e instanceof Error && e.message === MISSING_GEMINI_KEY_ERROR) {
            promptForApiKeys(['GEMINI']);
            setError("Your Gemini API key is missing or invalid. Please provide it.");
        } else {
            console.error(e);
            setError(`Failed to generate featured image. Please try again.`);
        }
        // Ensure loading is turned off on error, as handleGenerate's finally won't run.
        setLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleUpdateScene = (sceneNumber: number, updatedScene: Partial<Scene>) => {
    setParsedDoc(prevDoc => {
      if (!prevDoc) return null;
      const newScenes = prevDoc.scenes.map(s => s.sceneNumber === sceneNumber ? { ...s, ...updatedScene } : s);
      const newDoc = { ...prevDoc, scenes: newScenes };
      storage.saveDocumentToLocalStorage(newDoc);
      return newDoc;
    });
  };
  
  const handleUpdateVisualCue = (cueIndex: number, updatedCue: Partial<VisualCue>) => {
    setParsedDoc(prevDoc => {
      if (!prevDoc) return null;
      const newCues = prevDoc.visualCues.map((c, index) => index === cueIndex ? { ...c, ...updatedCue } : c);
      const newDoc = { ...prevDoc, visualCues: newCues };
      storage.saveDocumentToLocalStorage(newDoc);
      return newDoc;
    });
  };
  
  const handlePexelsSearch = async (query: string): Promise<{id: number, url: string}[] | {error: string}> => {
    try {
        const results = await searchPexelsVideos(query);
        return results;
    } catch (error) {
        // Fix: Corrected typo in constant name from MISSING_PEXels_KEY_ERROR to MISSING_PEXELS_KEY_ERROR.
        if (error instanceof Error && error.message === MISSING_PEXELS_KEY_ERROR) {
            promptForApiKeys(['PEXELS']);
            return { error: 'Your Pexels API key is missing or invalid. Please provide it.' };
        }
        console.error("Failed to search Pexels:", error);
        return { error: error instanceof Error ? error.message : "An unknown error occurred." };
    }
  };
  
  const handleBlogPexelsSearch = async () => {
    if (!parsedDoc) return;
    setIsBlogPexelsModalOpen(true);
    setIsBlogSearchingPexels(true);
    setBlogPexelsError(null);
    setBlogPexelsResults([]);
    try {
        const keywords = await extractKeywords(parsedDoc.rawContent);
        setBlogPexelsQuery(keywords);
        const response = await handlePexelsSearch(keywords);
        if ('error' in response) {
            setBlogPexelsError(response.error);
        } else {
            setBlogPexelsResults(response);
        }
    } catch(e) {
        if (e instanceof Error && e.message === MISSING_GEMINI_KEY_ERROR) {
            promptForApiKeys(['GEMINI']);
            setBlogPexelsError("Your Gemini API key is missing or invalid. Please provide it.");
        } else {
            console.error(e);
            setBlogPexelsError(e instanceof Error ? e.message : 'An unknown error occurred.');
        }
    } finally {
        setIsBlogSearchingPexels(false);
    }
  };

  const handleSaveAll = async () => {
    if (!parsedDoc) return;
    setLoading(prev => ({ ...prev, all: true }));
    // @ts-ignore
    const zip = new JSZip();

    // Add scripts
    const scriptsFolder = zip.folder("scripts");
    if(parsedDoc.voiceoverScript) scriptsFolder?.file("voiceover_script.txt", parsedDoc.voiceoverScript);
    if(parsedDoc.docType === DocType.PODCAST) scriptsFolder?.file("podcast_script.txt", parsedDoc.rawContent);
    if(parsedDoc.docType === DocType.ARTICLE || parsedDoc.docType === DocType.BLOG) scriptsFolder?.file("content.txt", parsedDoc.rawContent);


    // Add images
    const scenesFolder = zip.folder("scenes");
    for (const key in generatedImages) {
        if (key.startsWith('scene-')) {
            scenesFolder?.file(`${key}.png`, generatedImages[key], { base64: true });
        }
    }
    const cuesFolder = zip.folder("visual_cues");
    for (const key in generatedImages) {
        if (key.startsWith('cue-')) {
            cuesFolder?.file(`${key}.png`, generatedImages[key], { base64: true });
        }
    }

    // Add transparent image
    if (generatedImages.transparent) {
      const extrasFolder = zip.folder("extras");
      extrasFolder?.file("sam_stacks_transparent.png", generatedImages.transparent, { base64: true });
    }

    // Add featured image
    if (generatedImages['featured-image']) {
      zip.file("featured_image.png", generatedImages['featured-image'], { base64: true });
    }

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "ai_content_package.zip";
    link.click();
    URL.revokeObjectURL(link.href);

    setLoading(prev => ({ ...prev, all: false }));
  };

  const handleClearAll = () => {
    setParsedDoc(null);
    setGeneratedImages({});
    setLoading({});
    setError(null);
    storage.clearLocalStorage();
  }

  const renderContentPackage = () => {
    if (!parsedDoc) return null;

    switch (parsedDoc.docType) {
      case DocType.REELS:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Reels Content Package</h3>
            {parsedDoc.scenes.map(scene => (
              <SceneCard
                key={scene.sceneNumber}
                scene={scene}
                onGenerate={handleGenerateScene}
                onUpdateScene={handleUpdateScene}
                onPexelsSearch={handlePexelsSearch}
                generatedImage={generatedImages[`scene-${scene.sceneNumber}`] || null}
                isLoading={loading[`scene-${scene.sceneNumber}`] || false}
                onPreviewRequest={setPreviewingImage}
              />
            ))}
          </div>
        );
      case DocType.PODCAST:
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-blue-300">Podcast Visual Cues</h3>
            {parsedDoc.visualCues.map((cue, index) => (
              <VisualCueCard
                key={index}
                cue={cue}
                cueIndex={index}
                onGenerate={handleGenerateVisualCue}
                onUpdateCue={handleUpdateVisualCue}
                onPexelsSearch={handlePexelsSearch}
                generatedImage={generatedImages[`cue-${index}`] || null}
                isLoading={loading[`cue-${index}`] || false}
                onPreviewRequest={setPreviewingImage}
              />
            ))}
          </div>
        );
      case DocType.ARTICLE:
      case DocType.BLOG:
        return (
          <>
            <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
              <h3 className="text-xl font-semibold text-blue-300 mb-4">{parsedDoc.docType} Content</h3>
              <h4 className="text-2xl font-bold mb-2">{parsedDoc.title}</h4>
              <p className="text-sm text-gray-400 mb-4">Topic: {parsedDoc.topic}</p>
              <pre className="whitespace-pre-wrap font-sans text-gray-300 bg-slate-900 p-4 rounded-md">{parsedDoc.rawContent}</pre>
            </div>
            <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
                <h3 className="text-xl font-semibold text-blue-300 mb-4">Assets</h3>
                <div className="space-y-6">
                    {/* Featured Image Section */}
                    <div>
                        <h4 className="text-lg font-semibold mb-2">Featured Image</h4>
                          <div 
                            className={`w-full aspect-video bg-slate-700 rounded-md flex items-center justify-center overflow-hidden mb-4 ${generatedImages['featured-image'] ? 'cursor-pointer' : ''}`}
                              onClick={() => generatedImages['featured-image'] && setPreviewingImage({
                                image: generatedImages['featured-image']!,
                                downloadName: 'featured_image.png'
                            })}
                        >
                            {loading['featured-image'] ? <LoadingSpinner className="w-10 h-10 text-blue-500" />
                            : generatedImages['featured-image'] ? <img src={`data:image/png;base64,${generatedImages['featured-image']}`} alt="Featured Image" className="w-full h-full object-cover" />
                            : <p className="text-gray-500 text-sm text-center p-4">Generate a featured image for the article.</p>}
                        </div>
                        <div className="flex gap-2">
                              <button onClick={handleGenerateFeaturedImage} disabled={loading['featured-image']} className="w-full flex items-center justify-center px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-slate-600">
                                {loading['featured-image'] ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <MagicIcon className="w-5 h-5 mr-2" />}
                                {generatedImages['featured-image'] ? 'Regenerate' : 'Generate'}
                            </button>
                            {generatedImages['featured-image'] && !loading['featured-image'] && (
                                <button onClick={() => downloadImage(generatedImages['featured-image']!, 'featured_image.png')} className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    {/* Pexels Search Section */}
                    <div>
                        <h4 className="text-lg font-semibold mb-2">Stock Footage Ideas</h4>
                        <p className="text-sm text-gray-400 mb-3">
                            Generate keywords from the article to search for relevant stock videos on Pexels.
                        </p>
                        <button
                            onClick={handleBlogPexelsSearch}
                            disabled={isBlogSearchingPexels}
                            className="w-full flex items-center justify-center px-4 py-2 bg-amber-600 text-white font-semibold rounded-md hover:bg-amber-700 disabled:bg-slate-600 transition-colors"
                        >
                            {isBlogSearchingPexels ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <SearchIcon className="w-5 h-5 mr-2" />}
                            Search Pexels with Keywords
                        </button>
                    </div>
                </div>
            </div>
          </>
        )
      default:
        return <p className="text-center text-yellow-400">Unsupported document type.</p>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-gray-200 font-sans">
      <ApiKeyModal
        isOpen={isApiKeyModalOpen}
        missingKeys={missingApiKeys}
        onSave={handleSaveApiKeys}
      />
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        settings={settings}
        onSave={handleSaveSettings}
        onReset={handleResetSettings}
      />
      
      <PexelsResultsModal
        isOpen={isBlogPexelsModalOpen}
        onClose={() => setIsBlogPexelsModalOpen(false)}
        results={blogPexelsResults}
        query={blogPexelsQuery}
        isLoading={isBlogSearchingPexels}
        error={blogPexelsError}
      />

      {previewingImage && (
        <ImagePreviewModal
          image={previewingImage.image}
          text={previewingImage.text}
          downloadName={previewingImage.downloadName}
          onClose={() => setPreviewingImage(null)}
        />
      )}

      <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Content Generator</h1>
          <div className="flex items-center gap-4">
            {parsedDoc && (
                <>
                <button
                    onClick={handleSaveAll}
                    disabled={loading.all}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-700 disabled:bg-slate-600 transition-colors"
                >
                    {loading.all ? <LoadingSpinner className="w-5 h-5" /> : <DownloadIcon className="w-5 h-5" />}
                    Save All
                </button>
                <button
                    onClick={handleClearAll}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-red-600 rounded-md hover:bg-red-700 transition-colors"
                >
                    <TrashIcon className="w-5 h-5" />
                    Clear
                </button>
                </>
            )}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              aria-label="Settings"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-md relative mb-6" role="alert">
                <strong className="font-bold">Error: </strong>
                <span className="block sm:inline">{error}</span>
            </div>
        )}
        {!parsedDoc ? (
          <FileUpload onFileUpload={handleFileUpload} disabled={Object.values(loading).some(v => v)} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {renderContentPackage()}
            </div>
            <div className="space-y-6">
                <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
                    <h3 className="text-xl font-semibold text-blue-300 mb-4">Package Details</h3>
                    <p className="text-sm mb-1"><strong className="text-gray-400">Topic:</strong> {parsedDoc.topic}</p>
                    <p className="text-sm"><strong className="text-gray-400">Type:</strong> {parsedDoc.docType}</p>
                    {parsedDoc.quote && (
                        <blockquote className="mt-4 border-l-4 border-blue-500 pl-4 italic text-gray-300">
                           "{parsedDoc.quote}"
                        </blockquote>
                    )}
                </div>

                {parsedDoc.transparentImagePrompt && (
                    <div className="bg-slate-800 rounded-lg p-6 shadow-lg">
                        <h3 className="text-xl font-semibold text-blue-300 mb-4">Transparent Image</h3>
                        <div 
                            className={`w-full aspect-square bg-slate-700 rounded-md flex items-center justify-center overflow-hidden mb-4 ${generatedImages.transparent ? 'cursor-pointer' : ''}`}
                             onClick={() => generatedImages.transparent && setPreviewingImage({
                                image: generatedImages.transparent!,
                                downloadName: 'sam_stacks_transparent.png'
                            })}
                        >
                            {loading.transparent ? <LoadingSpinner className="w-10 h-10 text-blue-500" />
                            : generatedImages.transparent ? <img src={`data:image/png;base64,${generatedImages.transparent}`} alt="Transparent Sam Stacks" className="w-full h-full object-contain" />
                            : <p className="text-gray-500 text-sm text-center p-4">Generate the transparent branding image.</p>}
                        </div>
                        <div className="flex gap-2">
                             <button onClick={handleGenerateTransparent} disabled={loading.transparent} className="w-full flex items-center justify-center px-4 py-2 bg-brand-secondary text-white font-semibold rounded-md hover:bg-blue-600 disabled:bg-slate-600">
                               {loading.transparent ? <LoadingSpinner className="w-5 h-5 mr-2" /> : <MagicIcon className="w-5 h-5 mr-2" />}
                               Generate
                            </button>
                            {generatedImages.transparent && !loading.transparent && (
                                <button onClick={() => downloadImage(generatedImages.transparent!, 'sam_stacks_transparent.png')} className="p-2 bg-slate-600 text-white rounded-md hover:bg-slate-500 transition-colors">
                                    <DownloadIcon className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;