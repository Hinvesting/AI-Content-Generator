import { AppSettings, ParsedDocument } from '../types';

const SETTINGS_KEY = 'aiContentGenerator_settings';
const DOCUMENT_KEY = 'aiContentGenerator_document';

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
    localStorage.removeItem(SETTINGS_KEY);
    localStorage.removeItem(DOCUMENT_KEY);
}