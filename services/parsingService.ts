import { ParsedDocument, Scene, VisualCue, DocType } from '../types';

export const parseDocument = (content: string): ParsedDocument => {
  const lines = content.split('\n').map(line => line.trim());
  let docType = DocType.UNKNOWN;

  if (content.includes('Daily Content Package: YouTube Short')) docType = DocType.YOUTUBE_SHORT;
  else if (content.includes('Daily Content Package: YouTube Long Form')) docType = DocType.YOUTUBE_LONG_FORM;
  else if (content.includes('Daily Content Package: Reels')) docType = DocType.REELS;
  else if (content.includes('Podcast Script')) docType = DocType.PODCAST;
  else if (content.includes('Blog Post')) docType = DocType.BLOG;
  else if (content.includes('Article:')) docType = DocType.ARTICLE;

  const getSection = (startMarker: string, endMarker?: string): string => {
    const startIndex = content.indexOf(startMarker);
    if (startIndex === -1) return '';
    let endIndex = content.length;
    if(endMarker) {
        const nextSectionIndex = content.indexOf(endMarker, startIndex + startMarker.length);
        if (nextSectionIndex !== -1) {
            endIndex = nextSectionIndex;
        }
    }
    return content.substring(startIndex + startMarker.length, endIndex).trim();
  };
  
  const getSimpleValue = (key: string): string => {
      const line = lines.find(l => l.startsWith(key));
      return line ? line.replace(key, '').trim() : '';
  };

  const getMultiLineValue = (startKey: string, endKey?: string): string => {
    let capturing = false;
    const result: string[] = [];
    for (const line of lines) {
        if(line.startsWith(startKey)) {
            capturing = true;
            result.push(line.replace(startKey, '').trim());
            continue;
        }
        if(endKey && line.startsWith(endKey)) {
            capturing = false;
            break;
        }
        if (capturing && line) {
            result.push(line);
        }
    }
    return result.join('\n');
  }

  const scenes: Scene[] = [];
  if (docType === DocType.REELS || docType === DocType.YOUTUBE_SHORT) {
    const sceneSections = content.split('Scene ');
    for (const section of sceneSections) {
      if (!/^\d+:/.test(section)) continue;
      const sceneNumber = parseInt(section.match(/^(\d+):/)?.[1] || '0', 10);
      const sceneContent = section.substring(section.indexOf('\n'));
      
      const backgroundPrompt = sceneContent.match(/1\. Background Prompt: (.*)/)?.[1]?.trim() || '';
      const textOverlay = sceneContent.match(/2\. Text Overlay: (.*)/)?.[1]?.trim() || '';
      const pexelsSearch = sceneContent.match(/3\. (Pexels Search|Video Search Terms): (.*)/)?.[2]?.trim() || '';

      if (sceneNumber) {
        scenes.push({ sceneNumber, backgroundPrompt, textOverlay, pexelsSearch });
      }
    }
  }
  
  const visualCues: VisualCue[] = [];
  if(docType === DocType.PODCAST) {
    const cueSections = content.split('Cue Point:');
    for(const section of cueSections.slice(1)) {
        const cuePoint = section.split('\n')[0].trim();
        const imageType = section.match(/Image Type: (.*)/)?.[1]?.trim() || '';
        const backgroundPrompt = section.match(/Background Prompt: (.*)/)?.[1]?.trim() || '';
        const purpose = section.match(/Purpose: (.*)/)?.[1]?.trim() || '';
        visualCues.push({ cuePoint, imageType, backgroundPrompt, purpose, pexelsSearch: '' });
    }
  }

  if (docType === DocType.YOUTUBE_LONG_FORM) {
    const visualCuesSection = getSection('Visual Cues (for Video Production)', 'Legal Disclaimer');
    if (visualCuesSection) {
        const cueLines = visualCuesSection.split('\n').map(l => l.trim()).filter(l => l);
        let currentCue: Partial<VisualCue> & { cuePoint?: string } = {};

        const commitCue = () => {
            if (currentCue.cuePoint) {
                 visualCues.push({
                    cuePoint: currentCue.cuePoint || '',
                    imageType: '',
                    backgroundPrompt: currentCue.backgroundPrompt || '',
                    purpose: currentCue.purpose || '',
                    pexelsSearch: currentCue.backgroundPrompt || ''
                });
            }
        };

        for (const line of cueLines) {
            const cuePointMatch = line.match(/\d+\.\s*Cue Point:\s*(.*)/);
            const bgPromptMatch = line.match(/\d+\.\s*Background Prompt:\s*(.*)/);
            const purposeMatch = line.match(/\d+\.\s*Purpose:\s*(.*)/);

            if (cuePointMatch) {
                commitCue(); // Commit the previous cue before starting a new one
                currentCue = { cuePoint: cuePointMatch[1] };
            } else if (bgPromptMatch) {
                currentCue.backgroundPrompt = bgPromptMatch[1];
            } else if (purposeMatch) {
                currentCue.purpose = purposeMatch[1];
            }
        }
        commitCue(); // Commit the last cue
    }
  }

  let voiceoverScript = getSection('Voiceover Script', 'Visuals & Overlays');
  if (!voiceoverScript) {
      voiceoverScript = getSection('Full Script', 'Visual Cues (for Video Production)');
  }

  return {
    docType,
    topic: getSimpleValue('Topic:'),
    title: getSimpleValue('Title:') || (lines[0].includes(':') ? lines[0].split(':')[1]?.trim() : lines[0]),
    summary: getMultiLineValue('Summary', 'What is Digital Literacy'),
    quote: getSimpleValue('Quote:'),
    voiceoverScript,
    scenes,
    visualCues,
    transparentImagePrompt: getSection('Transparent Sam Stacks Image Description', 'Social Media Details'),
    rawContent: content,
  };
};