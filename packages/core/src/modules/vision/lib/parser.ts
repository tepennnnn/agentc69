export interface ParsedImageAnalysis {
  imageDescription: string;
  positivePrompt: string;
  negativePrompt: string;
}

export function parseImageAnalysisOutput(rawText: string): ParsedImageAnalysis {
  const text = rawText.trim();
  if (!text) {
    return {
      imageDescription: "",
      positivePrompt: "",
      negativePrompt: "",
    };
  }

  // Regexes to locate the 3 required sections with any markdown heading or bold decoration
  const descHeaderRegex = /(?:^|\n)(?:#{1,4}\s*)?(?:\*\*)?IMAGE\s+DESCRIPTION:?(?:\*\*)?\s*/i;
  const posHeaderRegex = /(?:^|\n)(?:#{1,4}\s*)?(?:\*\*)?POSITIVE\s+PROMPT:?(?:\*\*)?\s*/i;
  const negHeaderRegex = /(?:^|\n)(?:#{1,4}\s*)?(?:\*\*)?NEGATIVE\s+PROMPT:?(?:\*\*)?\s*/i;

  const descMatch = descHeaderRegex.exec(text);
  const posMatch = posHeaderRegex.exec(text);
  const negMatch = negHeaderRegex.exec(text);

  let imageDescription = "";
  let positivePrompt = "";
  let negativePrompt = "";

  if (descMatch && posMatch && descMatch.index < posMatch.index) {
    imageDescription = text.substring(descMatch.index + descMatch[0].length, posMatch.index).trim();
  }

  if (posMatch) {
    const posStart = posMatch.index + posMatch[0].length;
    if (negMatch && negMatch.index > posMatch.index) {
      positivePrompt = text.substring(posStart, negMatch.index).trim();
      negativePrompt = text.substring(negMatch.index + negMatch[0].length).trim();
    } else {
      positivePrompt = text.substring(posStart).trim();
    }
  } else if (!descMatch && !negMatch) {
    // If no headings found, treat entire text as positivePrompt
    positivePrompt = text;
  }

  // Clean trailing markdown markers or artifacts if any
  imageDescription = cleanSection(imageDescription);
  positivePrompt = cleanSection(positivePrompt);
  negativePrompt = cleanSection(negativePrompt);

  return {
    imageDescription,
    positivePrompt,
    negativePrompt,
  };
}

function cleanSection(content: string): string {
  let cleaned = content.trim();
  // Strip trailing separator bars (---)
  cleaned = cleaned.replace(/\n\s*---\s*$/g, "").trim();
  return cleaned;
}
