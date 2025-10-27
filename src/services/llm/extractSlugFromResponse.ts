// Extract slug from LLM response frontmatter
// Parses YAML frontmatter to extract the slug field

export const extractSlugFromResponse = (response: string): string | null => {
  // Match YAML frontmatter between --- delimiters
  const frontmatterMatch = response.match(/^---\s*\n([\s\S]*?)\n---/);

  if (!frontmatterMatch) {
    return null;
  }

  const frontmatter = frontmatterMatch[1];

  // Extract slug field from frontmatter
  const slugMatch = frontmatter.match(/slug:\s*['"]?([^'">\n]+)['"]?/);

  if (!slugMatch) {
    return null;
  }

  // Clean and validate slug
  const slug = slugMatch[1].trim();

  // Ensure slug is URL-friendly (lowercase, hyphens, alphanumeric)
  if (!/^[a-z0-9-]+$/.test(slug)) {
    console.warn(`Invalid slug format: ${slug}. Expected lowercase alphanumeric with hyphens.`);
    return null;
  }

  return slug;
};
