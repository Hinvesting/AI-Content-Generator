
import { ParsedDocument, Scene, VisualCue, DocType } from '../types';

const parseParableFormat = (content: string): ParsedDocument => {
    const getSectionContent = (startMarker: string, endMarker?: string): string => {
        let section = content;
        
        const startIndex = section.indexOf(startMarker);
        if (startIndex === -1) return '';
        section = section.substring(startIndex + startMarker.length);
        
        if (endMarker) {
            const endIndex = section.indexOf(endMarker);
            if (endIndex !== -1) {
                section = section.substring(0, endIndex);
            }
        }
        
        return section.replace(/_+\n/, '').trim().split('\n').filter(line => line.trim() !== '').join('\n');
    };

    const title = content.match(/🎬 Title: (.*)/)?.[1]?.trim() || 'Untitled Story';
    
    const scenes: Scene[] = [];
    const sceneScriptSection = getSectionContent('🎬 Scene-by-Scene Script', '📱 YouTube Short Script');
    const sceneBlocks = sceneScriptSection.split('Scene ');
    
    let fullVoiceover = '';

    for (const block of sceneBlocks) {
        if (!/^\d+/.test(block)) continue;
        
        const sceneNumber = parseInt(block.match(/^(\d+)/)![1], 10);
        
        const voMatch = block.match(/🎙️ VO:([\s\S]*?)(?=🖼️ Visual:|$)/);
        const visualMatch = block.match(/🖼️ Visual:([\s\S]*)/);

        const voiceover = voMatch ? voMatch[1].replace(/\n/g, ' ').trim() : '';
        const visual = visualMatch ? visualMatch[1].replace(/\n/g, ' ').trim() : '';
        
        if (voiceover) {
            fullVoiceover += `Scene ${sceneNumber}: ${voiceover}\n\n`;
        }

        if (visual) {
            scenes.push({
                sceneNumber: sceneNumber,
                backgroundPrompt: visual,
                textOverlay: voiceover,
                pexelsSearch: visual.split('.')[0].split(',')[0].trim()
            });
        }
    }

    return {
        docType: DocType.YOUTUBE_SHORT,
        topic: title,
        title: title,
        summary: getSectionContent('📖 Full Parable Story', '🎬 Scene-by-Scene Script'),
        quote: '',
        voiceoverScript: fullVoiceover.trim(),
        scenes: scenes,
        visualCues: [],
        transparentImagePrompt: getSectionContent('🖼️ Thumbnail Prompt', '⚖️ Disclaimer'),
        rawContent: content,
    };
};

const parseHazeAiFormat = (content: string): ParsedDocument => {
    const title = content.match(/\*\*Title:\*\*\s*(.*)/)?.[1]?.trim() || 'Untitled';
    const thumbnailPrompt = content.match(/\*\*Thumbnail Image prompt:\*\*\s*([\s\S]*?)(?=\*\*Scene 1:\*\*|$)/)?.[1]?.trim() || '';

    const scenes: Scene[] = [];
    const sceneBlocks = content.split(/\*\*\s*Scene\s+\d+:\s*\*\*/).slice(1);
    let fullVoiceover = '';

    sceneBlocks.forEach((block, index) => {
        const sceneNumber = index + 1;
        
        const backgroundPromptMatch = block.match(/^([\s\S]*?)\s*\*/);
        const backgroundPrompt = backgroundPromptMatch ? backgroundPromptMatch[1].trim().replace(/\n/g, ' ') : '';
        
        const textOverlayMatch = block.match(/\*\s*\*\*Text Overlay:\*\*\s*(.*)/);
        const textOverlay = textOverlayMatch ? textOverlayMatch[1].trim() : '';

        const voiceoverMatch = block.match(/\*\s*\*\*Voiceover:\*\*\s*"(.*?)"/s);
        const voiceover = voiceoverMatch ? voiceoverMatch[1].trim() : '';
        
        if (voiceover) {
            fullVoiceover += `Scene ${sceneNumber}: ${voiceover}\n\n`;
        }
        
        if (backgroundPrompt || textOverlay) {
            scenes.push({
                sceneNumber,
                backgroundPrompt,
                textOverlay,
                pexelsSearch: textOverlay || backgroundPrompt.split('.')[0]
            });
        }
    });

    return {
        docType: DocType.YOUTUBE_SHORT,
        topic: title,
        title: title,
        summary: '',
        quote: '',
        voiceoverScript: fullVoiceover.trim(),
        scenes: scenes,
        visualCues: [],
        transparentImagePrompt: thumbnailPrompt,
        rawContent: content,
    };
};

const parsePodcastSegmentFormat = (content: string): ParsedDocument => {
    const title = content.match(/\[EPISODE TITLE\]:\s*(.*)/)?.[1]?.trim() || 'Untitled Podcast';
    const summary = content.match(/\[KEY MESSAGE\/THEME\]:\s*([\s\S]*?)(?=\[SEGMENT 1:|$)/)?.[1]?.trim() || '';

    const visualCues: VisualCue[] = [];
    const segmentBlocks = content.split(/\[SEGMENT \d+:/).slice(1);
    let fullScript = '';

    segmentBlocks.forEach((block, index) => {
        const cuePointMatch = block.match(/^(.*?)]/);
        const cuePoint = cuePointMatch ? cuePointMatch[1].trim() : `Segment ${index + 1}`;
        
        const objectiveMatch = block.match(/\*\s*\*\*Objective:\*\*\s*([\s\S]*?)(?=\*\s*\*\*Content:\*\*|$)/);
        const purpose = objectiveMatch ? objectiveMatch[1].trim() : '';

        const contentMatch = block.match(/\*\s*\*\*Content:\*\*\s*"([\s\S]*?)"(?=\s*\* \*\*Host Image Prompt:\*\*|$)/);
        const scriptSegment = contentMatch ? contentMatch[1].trim().replace(/\n/g, ' ') : '';
        
        const imagePromptMatch = block.match(/\*\s*\*\*Host Image Prompt:\*\*\s*([\s\S]*?)(?=\[SEGMENT|$)/);
        const backgroundPrompt = imagePromptMatch ? imagePromptMatch[1].trim().replace(/\n/g, ' ') : '';

        if(scriptSegment) {
            fullScript += `${cuePoint}:\n${scriptSegment}\n\n`;
        }

        if(backgroundPrompt) {
             visualCues.push({
                cuePoint,
                imageType: '',
                backgroundPrompt,
                purpose,
                pexelsSearch: backgroundPrompt.split('.')[0].split(',')[0].trim()
            });
        }
    });

    return {
        docType: DocType.PODCAST,
        topic: title,
        title: title,
        summary: summary,
        quote: '',
        voiceoverScript: fullScript.trim(),
        scenes: [],
        visualCues: visualCues,
        transparentImagePrompt: '',
        rawContent: content,
    };
};


export const parseDocument = (content: string): ParsedDocument => {
  const trimmedContent = content.trim();

  // New Haze AI Short Form Format Check
  if (trimmedContent.startsWith('**Title:**') && trimmedContent.includes('**Scene 1:**')) {
      return parseHazeAiFormat(content);
  }
  
  // New Podcast/Long Form Segment Format Check
  if (trimmedContent.startsWith('[EPISODE TITLE]:') && trimmedContent.includes('[SEGMENT 1:')) {
      return parsePodcastSegmentFormat(content);
  }

  // Existing "Parable" Format Check
  if (trimmedContent.startsWith('🎬 Title:') && content.includes('🎬 Scene-by-Scene Script')) {
      return parseParableFormat(content);
  }

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
