// Removes code blocks from text (for audio-friendly output)
// Pure function

export const removeCodeBlocks = (text: string): string => {
  // Remove fenced code blocks (```...```)
  let cleaned = text.replace(/```[\s\S]*?```/g, "[kod usunięty]");

  // Remove inline code (`...`)
  cleaned = cleaned.replace(/`[^`]+`/g, "");

  return cleaned;
};
