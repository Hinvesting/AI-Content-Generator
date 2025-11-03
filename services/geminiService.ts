import { GoogleGenAI, Modality } from "@google/genai";
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

export const generateTransparentImage = async (
  prompt: string,
  referenceImageB64: string | null
): Promise<string> => {
  const apiKey = getApiKey('GEMINI');
  if (!apiKey) {
    throw new Error(MISSING_GEMINI_KEY_ERROR);
  }
  const ai = new GoogleGenAI({ apiKey });

  // If there's no reference image, use Imagen for high-quality text-to-image with transparency instructions.
  if (!referenceImageB64) {
    const fullPrompt = `From the following description, render ONLY the main character or central subject. The final image MUST have a fully transparent background (alpha channel). Ignore all instructions about backgrounds, text overlays, or scene composition. Description: "${prompt}"`;
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: fullPrompt,
      config: { numberOfImages: 1, outputMimeType: 'image/png', aspectRatio: '1:1' },
    });
    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages[0].image.imageBytes;
    } else {
      throw new Error("No transparent image was generated.");
    }
  }

  // If there IS a reference image, use the multimodal model to edit it.
  const imagePart = {
    inlineData: {
      data: referenceImageB64,
      mimeType: 'image/jpeg', // Assume jpeg, can be improved to detect mime type
    },
  };
  
  const textPart = {
    text: `Using the provided image as a reference for the character's style, pose, and features, generate a new image of that character. The final image MUST have a fully transparent background (alpha channel). Prompt: "${prompt}"`,
  };

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts: [imagePart, textPart] },
    config: {
        responseModalities: [Modality.IMAGE],
    },
  });
  
  for (const part of response.candidates[0].content.parts) {
    if (part.inlineData) {
      return part.inlineData.data;
    }
  }

  throw new Error("No image was generated from the reference.");
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


export const enhanceScriptForTTS = async (script: string): Promise<string> => {
    const apiKey = getApiKey('GEMINI');
    if (!apiKey) {
        throw new Error(MISSING_GEMINI_KEY_ERROR);
    }
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert voiceover script editor. Your task is to enhance the following script for a text-to-speech (TTS) engine.
The script is for a fast-paced, energetic financial advice video.
Instructions:
1.  Review the script for clarity and flow.
2.  Add pauses for dramatic effect and pacing. Use '[sp]' for a short pause and '[mp]' for a medium pause.
3.  Do not change the words of the original script.
4.  Ensure the final output is only the edited script, ready to be fed into a TTS engine.

Original Script:
---
${script}
---
`;
    
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error enhancing script for TTS:", error);
        if (error instanceof Error && (error.message.includes('API key not valid') || error.message.includes('400'))) {
            throw new Error(MISSING_GEMINI_KEY_ERROR);
        }
        throw error;
    }
};