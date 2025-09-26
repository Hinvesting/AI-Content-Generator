
import { getApiKey } from './apiKeyService';

export const MISSING_PEXELS_KEY_ERROR = "MISSING_PEXELS_KEY";

interface PexelsVideo {
    id: number;
    url: string; 
    video_files: {
        link: string;
    }[];
}

interface PexelsVideoSearchResponse {
    videos: PexelsVideo[];
}

export const searchPexelsVideos = async (query: string): Promise<{id: number, url: string}[]> => {
    const pexelsApiKey = getApiKey('PEXELS');
    if (!pexelsApiKey) {
        throw new Error(MISSING_PEXELS_KEY_ERROR);
    }

    const response = await fetch(`https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&per_page=10`, {
        headers: {
            Authorization: pexelsApiKey,
        },
    });

    if (!response.ok) {
        // If unauthorized, throw a specific error to trigger the API key modal.
        if (response.status === 401 || response.status === 403) {
             throw new Error(MISSING_PEXELS_KEY_ERROR);
        }
        const errorBody = await response.text();
        console.error("Failed to fetch from Pexels API:", response.status, errorBody);
        throw new Error(`Failed to fetch from Pexels API. Status: ${response.status}.`);
    }

    const data: PexelsVideoSearchResponse = await response.json();

    return data.videos.map(video => ({
        id: video.id,
        url: video.url,
    }));
};
