// Simplifies technical terms for audio consumption
// Pure function - basic replacements for common terms

export const simplifyTechnicalTerms = (text: string): string => {
  const replacements: Record<string, string> = {
    "API": "A P I",
    "HTML": "H T M L",
    "CSS": "C S S",
    "JavaScript": "dżawaskrypt",
    "TypeScript": "tajpskrypt",
    "React": "rieakt",
    "Node.js": "noud dżej es",
    "npm": "en pi em",
    "Git": "git",
    "GitHub": "githab",
  };

  let result = text;
  for (const [term, replacement] of Object.entries(replacements)) {
    const regex = new RegExp(`\\b${term}\\b`, "gi");
    result = result.replace(regex, replacement);
  }

  return result;
};
