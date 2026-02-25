/**
 * Parser pour extraire les sections du markdown ai_insights
 * vers une structure JSON exploitable par le générateur HTML
 */

export interface ParsedSections {
  profile_analysis: string;
  executive_summary: string;
  health_and_algorithm: string;
  strengths: string[];
  improvements: string[];
  short_term_plan: string[];
  mid_term_strategy: string[];
  hashtags_strategy: string;
}

function extractSection(markdown: string, sectionPatterns: RegExp[]): string {
  for (const pattern of sectionPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      return match[1]?.trim() || '';
    }
  }
  return '';
}

function extractListItems(sectionContent: string): string[] {
  const items: string[] = [];
  const lines = sectionContent.split('\n');
  
  for (const line of lines) {
    const bulletMatch = line.match(/^[\s]*[-*•]\s*(.+)$/);
    const numberedMatch = line.match(/^[\s]*\d+[.)]\s*(.+)$/);
    
    if (bulletMatch) {
      items.push(bulletMatch[1].trim());
    } else if (numberedMatch) {
      items.push(numberedMatch[1].trim());
    }
  }
  
  return items;
}

export function parseAIInsightsToSections(markdown: string): ParsedSections {
  if (!markdown) {
    return {
      profile_analysis: '',
      executive_summary: '',
      health_and_algorithm: '',
      strengths: [],
      improvements: [],
      short_term_plan: [],
      mid_term_strategy: [],
      hashtags_strategy: ''
    };
  }

  const profilePatterns = [
    /(?:#{1,3}\s*)?0\.?\s*(?:🎨)?\s*ANALYSE DU PROFIL[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:1\.|📈|RÉSUMÉ)|$)/i,
    /ANALYSE DU PROFIL[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:1\.|RÉSUMÉ)|$)/i
  ];
  const profileSection = extractSection(markdown, profilePatterns);

  const summaryPatterns = [
    /(?:#{1,3}\s*)?1\.?\s*(?:📈)?\s*RÉSUMÉ EXÉCUTIF[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:2\.|✅|SANTÉ)|$)/i,
    /RÉSUMÉ EXÉCUTIF[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:2\.|SANTÉ)|$)/i
  ];
  const summarySection = extractSection(markdown, summaryPatterns);

  const healthPatterns = [
    /(?:#{1,3}\s*)?2\.?\s*(?:✅)?\s*SANTÉ GLOBALE[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:3\.|💪|POINTS FORTS)|$)/i,
    /SANTÉ GLOBALE[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:3\.|POINTS FORTS)|$)/i
  ];
  const healthSection = extractSection(markdown, healthPatterns);

  const strengthsPatterns = [
    /(?:#{1,3}\s*)?3\.?\s*(?:💪)?\s*POINTS FORTS[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:4\.|⚠️|AXES D'AMÉLIORATION)|$)/i,
    /POINTS FORTS[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:4\.|AXES)|$)/i
  ];
  const strengthsSection = extractSection(markdown, strengthsPatterns);
  const strengths = extractListItems(strengthsSection);

  const improvementsPatterns = [
    /(?:#{1,3}\s*)?4\.?\s*(?:⚠️)?\s*AXES D'AMÉLIORATION[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:5\.|🎯|PLAN D'ACTION)|$)/i,
    /AXES D'AMÉLIORATION[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:5\.|PLAN)|$)/i
  ];
  const improvementsSection = extractSection(markdown, improvementsPatterns);
  const improvements = extractListItems(improvementsSection);

  const shortTermPatterns = [
    /(?:#{1,3}\s*)?5\.?\s*(?:🎯)?\s*PLAN D'ACTION[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:6\.|🚀|STRATÉGIE)|$)/i,
    /PLAN D'ACTION[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:6\.|STRATÉGIE)|$)/i
  ];
  const shortTermSection = extractSection(markdown, shortTermPatterns);
  const shortTermPlan = extractListItems(shortTermSection);

  const midTermPatterns = [
    /(?:#{1,3}\s*)?6\.?\s*(?:🚀)?\s*STRATÉGIE[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:7\.|🏷️|HASHTAGS)|$)/i,
    /STRATÉGIE[^\n]*\n([\s\S]*?)(?=(?:#{1,3}\s*)?(?:7\.|HASHTAGS)|$)/i
  ];
  const midTermSection = extractSection(markdown, midTermPatterns);
  const midTermStrategy = extractListItems(midTermSection);

  const hashtagsPatterns = [
    /(?:#{1,3}\s*)?7\.?\s*(?:🏷️)?\s*HASHTAGS[^\n]*\n([\s\S]*?)$/i,
    /HASHTAGS[^\n]*\n([\s\S]*?)$/i
  ];
  const hashtagsSection = extractSection(markdown, hashtagsPatterns);

  return {
    profile_analysis: profileSection,
    executive_summary: summarySection,
    health_and_algorithm: healthSection,
    strengths: strengths.length > 0 ? strengths : extractFallbackList(strengthsSection),
    improvements: improvements.length > 0 ? improvements : extractFallbackList(improvementsSection),
    short_term_plan: shortTermPlan.length > 0 ? shortTermPlan : extractFallbackList(shortTermSection),
    mid_term_strategy: midTermStrategy.length > 0 ? midTermStrategy : extractFallbackList(midTermSection),
    hashtags_strategy: hashtagsSection
  };
}

function extractFallbackList(content: string): string[] {
  if (!content) return [];
  const paragraphs = content
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(p => p.length > 10 && !p.startsWith('#'));
  return paragraphs.slice(0, 6);
}
