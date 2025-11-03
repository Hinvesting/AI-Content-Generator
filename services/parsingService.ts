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
    const sceneRegex = /Scene\s+(\d+)([\s\S]*?)(?=Scene\s+\d+|$)/gi;

    let fullVoiceover = '';
    let match;

    while ((match = sceneRegex.exec(sceneScriptSection)) !== null) {
        const sceneNumber = parseInt(match[1], 10);
        const block = match[2];

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
                actionPrompt: '',
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

export const parseVideoPackage = (files: { script: string; visuals: string; metadata: string; branding: string }): ParsedDocument => {
    const { script, visuals, metadata } = files;

    const titleMatch = metadata.match(/^Title: (.*)$/m);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled Video';

    const descriptionMatch = metadata.match(/^Description:\s*([\s\S]*?)(?=\n\d+:\d{2}|\nTags:|$)/m);
    const summary = descriptionMatch ? descriptionMatch[1].trim() : '';

    const thumbnailPromptMatch = metadata.match(/^Thumbnail Prompt: ([\s\S]*?)$/m);
    const transparentImagePrompt = thumbnailPromptMatch ? thumbnailPromptMatch[1].trim() : '';

    const scenes: Scene[] = [];
    const scriptSceneBlocks = script.split('---').filter(s => s.trim());
    const visualSceneBlocks = visuals.split('====================').filter(s => s.trim());
    
    const sceneCount = Math.min(scriptSceneBlocks.length, visualSceneBlocks.length);

    for (let i = 0; i < sceneCount; i++) {
        const scriptBlock = scriptSceneBlocks[i].trim();
        const visualBlock = visualSceneBlocks[i].trim();

        const sceneNumberMatch = scriptBlock.match(/^Scene\s+(\d+):/);
        if (!sceneNumberMatch) continue;

        const sceneNumber = parseInt(sceneNumberMatch[1], 10);

        const voiceover = scriptBlock.substring(sceneNumberMatch[0].length).replace(/\n/g, ' ').trim();
        const textOverlay = voiceover;

        const pexelsSearchMatch = visualBlock.match(/^Stock Footage \(Primary\): (.*)$/m);
        const pexelsSearch = pexelsSearchMatch ? pexelsSearchMatch[1].trim() : '';
        
        let backgroundPrompt = 'No cinematic prompt found.';
        let actionPrompt = '';
        
        const cinematicPromptsHeader = 'Cinematic Prompts:';
        const cinematicPromptsIndex = visualBlock.indexOf(cinematicPromptsHeader);

        if (cinematicPromptsIndex !== -1) {
            const promptsText = visualBlock.substring(cinematicPromptsIndex + cinematicPromptsHeader.length).trim();
            const allPrompts = promptsText.split('\n')
                .map(p => p.trim())
                .filter(p => p.startsWith('- '))
                .map(p => p.substring(2).trim());

            if (allPrompts.length > 0) {
                backgroundPrompt = allPrompts[0];
            }
            if (allPrompts.length > 1) {
                actionPrompt = allPrompts.slice(1).join(' ');
            }
        }

        scenes.push({ sceneNumber, textOverlay, backgroundPrompt, actionPrompt, pexelsSearch });
    }

    const fullVoiceover = scenes.map(s => `Scene ${s.sceneNumber}: ${s.textOverlay}`).join('\n\n');
    const rawContent = `--- SCRIPT ---\n${script}\n--- VISUALS ---\n${visuals}\n--- METADATA ---\n${metadata}\n--- BRANDING ---\n${files.branding}`;

    return {
        docType: DocType.YOUTUBE_SHORT,
        topic: title,
        title,
        summary,
        quote: '',
        voiceoverScript: fullVoiceover,
        scenes,
        visualCues: [],
        transparentImagePrompt,
        rawContent
    };
};


export const parseDocument = (content: string): ParsedDocument => {
  const trimmedContent = content.trim();

  // Check for the original "Parable" format.
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
      if (!section.trim() || !/^\d+:/.test(section.trim())) continue;
      
      const sceneNumber = parseInt(section.split(':')[0], 10);
      const sceneContent = section.substring(section.indexOf(':') + 1).trim();
      
      const backgroundPrompt = sceneContent.match(/1\. Background Prompt: (.*)/)?.[1]?.trim() || '';
      const textOverlay = sceneContent.match(/2\. Text Overlay: (.*)/)?.[1]?.trim() || '';
      const pexelsSearch = sceneContent.match(/3\. (Pexels Search|Video Search Terms): (.*)/)?.[2]?.trim() || '';

      if (sceneNumber) {
        scenes.push({ sceneNumber, backgroundPrompt, actionPrompt: '', textOverlay, pexelsSearch });
      }
    }
  }
  
  const visualCues: VisualCue[] = [];
  if(docType === DocType.PODCAST) {
    const cueSections = content.split('Cue Point:');
    for (let i = 1; i < cueSections.length; i++) { // Start at 1 to skip content before the first cue
        const section = cueSections[i];
        if (!section.trim()) continue;

        const sectionLines = section.trim().split('\n');
        const cuePoint = sectionLines[0].trim();
        const imageType = section.match(/Image Type: (.*)/)?.[1]?.trim() || '';
        const backgroundPrompt = section.match(/Background Prompt: (.*)/)?.[1]?.trim() || '';
        const purpose = section.match(/Purpose: (.*)/)?.[1]?.trim() || '';
        if (cuePoint) {
            visualCues.push({ cuePoint, imageType, backgroundPrompt, purpose, pexelsSearch: '' });
        }
    }
  }

  if (docType === DocType.YOUTUBE_LONG_FORM) {
    const visualCuesSection = getSection('Visual Cues (for Video Production)', 'Legal Disclaimer');
    const lines = visualCuesSection.split('\n').map(l => l.trim());
    let currentCue: Partial<VisualCue> = {};

    for (const line of lines) {
        if (/^\d+\.\s*Cue Point:/.test(line)) {
            if (currentCue.cuePoint) { // Push the previously parsed cue
                visualCues.push(currentCue as VisualCue);
            }
            currentCue = {
                cuePoint: line.replace(/^\d+\.\s*Cue Point:/, '').trim(),
                imageType: '',
                pexelsSearch: ''
            };
        } else if (line.startsWith('Background Prompt:')) {
            currentCue.backgroundPrompt = line.replace('Background Prompt:', '').trim();
            if (currentCue.backgroundPrompt) {
                 currentCue.pexelsSearch = currentCue.backgroundPrompt.split('.')[0].split(',')[0].trim() || currentCue.cuePoint || '';
            }
        } else if (line.startsWith('Purpose:')) {
            currentCue.purpose = line.replace('Purpose:', '').trim();
        }
    }
    if (currentCue.cuePoint) { // Push the very last cue
        visualCues.push(currentCue as VisualCue);
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