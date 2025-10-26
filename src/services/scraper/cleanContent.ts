// Pure function: Cleans extracted content
// Removes extra whitespace, normalizes line breaks

/**
 * @param content - Raw content string
 * @returns Cleaned content string
 */
export const cleanContent = (content: string): string => {
  return (
    content
      // Remove HTML tags if any remain
      .replace(/<[^>]*>/g, "")
      // Normalize multiple line breaks to double line break
      .replace(/\n{3,}/g, "\n\n")
      // Normalize whitespace (but preserve single line breaks)
      .replace(/ +/g, " ")
      // Trim
      .trim()
  );
};
