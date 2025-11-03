export interface Scene {
  sceneNumber: number;
  backgroundPrompt: string;
  actionPrompt: string;
  textOverlay: string;
  pexelsSearch: string;
}

export interface VisualCue {
  cuePoint: string;
  imageType: string;
  backgroundPrompt: string;
  purpose: string;
  pexelsSearch: string;
}

export enum DocType {
  REELS = 'Reels',
  ARTICLE = 'Article',
  BLOG = 'Blog',
  PODCAST = 'Podcast',
  YOUTUBE_SHORT = 'YouTube Short',
  YOUTUBE_LONG_FORM = 'YouTube Long Form',
  UNKNOWN = 'Unknown',
}

export interface ParsedDocument {
  docType: DocType;
  topic: string;
  title: string;
  summary: string;
  quote: string;
  voiceoverScript: string;
  scenes: Scene[];
  visualCues: VisualCue[];
  transparentImagePrompt: string;
  rawContent: string;
}

export interface AppSettings {
  style: 'photorealistic' | 'illustration' | 'cartoonish';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  tone: string;
}

export interface GeneratedImages {
  [key: string]: string; // key is 'scene-N' or 'transparent', value is base64 string
}

export interface LoadingStates {
  [key: string]: boolean; // key is 'scene-N', 'transparent', or 'all'
}