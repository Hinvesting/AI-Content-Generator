
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
