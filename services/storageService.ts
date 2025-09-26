
import { GeneratedImages, AppSettings, ParsedDocument } from '../types';

const IMAGES_KEY = 'aiContentGenerator_images';
const SETTINGS_KEY = 'aiContentGenerator_settings';
const DOCUMENT_KEY = 'aiContentGenerator_document';

export const saveImagesToLocalStorage = (images: GeneratedImages) => {
  localStorage.setItem(IMAGES_KEY, JSON.stringify(images));
};

export const loadImagesFromLocalStorage = (): GeneratedImages | null => {
  const data = localStorage.getItem(IMAGES_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveSettingsToLocalStorage = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const loadSettingsFromLocalStorage = (): AppSettings | null => {
  const data = localStorage.getItem(SETTINGS_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveDocumentToLocalStorage = (doc: ParsedDocument) => {
    localStorage.setItem(DOCUMENT_KEY, JSON.stringify(doc));
}

export const loadDocumentFromLocalStorage = (): ParsedDocument | null => {
    const data = localStorage.getItem(DOCUMENT_KEY);
    return data ? JSON.parse(data) : null;
}

export const clearLocalStorage = () => {
    localStorage.removeItem(IMAGES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(DOCUMENT_KEY);
}
