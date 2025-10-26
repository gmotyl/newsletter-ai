// Estimates token count for content (rough approximation)
// Pure function: 1 token ≈ 4 characters

export const estimateTokens = (content: string): number => {
  return Math.ceil(content.length / 4);
};
