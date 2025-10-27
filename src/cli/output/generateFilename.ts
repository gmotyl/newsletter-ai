// Generate filename from slug (extracted from LLM response) or fallback to newsletter data
export const generateFilename = (
  newsletter: string,
  date: Date,
  slug?: string
): string => {
  // If slug is provided, use it directly with .md extension
  if (slug) {
    return `${slug}.md`;
  }

  // Fallback: Generate filename from newsletter name and date
  // Format date as YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const dateStr = `${year}-${month}-${day}`;

  // Sanitize newsletter name (remove special characters)
  const safeName = newsletter
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${safeName}-${dateStr}.md`;
};
