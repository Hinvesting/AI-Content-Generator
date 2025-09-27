
import { GoogleGenAI } from "@google/genai";
import { AppSettings } from '../types';
import { getApiKey } from './apiKeyService';

export const MISSING_GEMINI_KEY_ERROR = "MISSING_GEMINI_KEY";

export const generateImage = async (
    prompt: string, 
    settings: AppSettings
  ): Promise<string> => {
  const apiKey = getApiKey('GEMINI');
  if (!apiKey) {
    throw new Error(MISSING_GEMINI_KEY_ERROR);
  }
  
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = `${prompt}, ${settings.style} style, ${settings.tone}, cinematic lighting`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/png',
        aspectRatio: settings.aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("No image was generated.");
    }
  } catch (error) {
    console.error("Error generating image with Gemini:", error);
    // If the error indicates an authentication issue, re-throw our specific error
    // to trigger the API key modal in the UI.
    if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
        throw new Error(MISSING_GEMINI_KEY_ERROR);
    }
    throw error;
  }
};

export const generateFeaturedImagePrompt = async (articleContent: string): Promise<string> => {
    const apiKey = getApiKey('GEMINI');
    if (!apiKey) {
        throw new Error(MISSING_GEMINI_KEY_ERROR);
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Based on the following article content, generate a concise, visually descriptive prompt for an AI image generator to create a compelling featured image. The prompt should capture the essence of the article. Article content: "${articleContent.substring(0, 2000)}..."`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error generating featured image prompt:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
            throw new Error(MISSING_GEMINI_KEY_ERROR);
        }
        throw error;
    }
};

export const extractKeywords = async (articleContent: string): Promise<string> => {
    const apiKey = getApiKey('GEMINI');
    if (!apiKey) {
        throw new Error(MISSING_GEMINI_KEY_ERROR);
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `Extract 3-5 relevant keywords from the following article content, suitable for searching a stock video/image library like Pexels. Return the keywords as a single comma-separated string. Article content: "${articleContent.substring(0, 2000)}..."`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error extracting keywords:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
            throw new Error(MISSING_GEMINI_KEY_ERROR);
        }
        throw error;
    }
};
