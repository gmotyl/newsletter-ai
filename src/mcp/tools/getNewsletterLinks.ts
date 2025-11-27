// MCP Tool: get_newsletter_links
// Returns links for a specific newsletter from LINKS.yaml

import { loadLinksFromYaml } from "../../utils/yaml.js";

interface NewsletterLink {
  title: string;
  url: string;
}

interface NewsletterLinksResult {
  name: string;
  date: string;
  uid: string;
  subject?: string;
  hashtags?: string[];
  links: NewsletterLink[];
}

export async function getNewsletterLinks(
  newsletterName: string,
  yamlPath: string = "LINKS.yaml",
  uid?: string
): Promise<NewsletterLinksResult> {
  try {
    const newsletters = await loadLinksFromYaml(yamlPath);

    let newsletter;

    // If UID is provided, prioritize finding by UID
    if (uid) {
      newsletter = newsletters.find((n) => n.id === uid);

      if (!newsletter) {
        throw new Error(
          `Newsletter with UID "${uid}" not found in LINKS.yaml. Available UIDs: ${newsletters
            .map((n) => `${n.pattern.name} (${n.id})`)
            .join(", ")}`
        );
      }
    } else {
      // Find newsletter by name (case-insensitive partial match)
      // This will return the first match when multiple newsletters have the same name
      newsletter = newsletters.find(
        (n) =>
          n.pattern.name.toLowerCase().includes(newsletterName.toLowerCase()) ||
          newsletterName.toLowerCase().includes(n.pattern.name.toLowerCase())
      );

      if (!newsletter) {
        throw new Error(
          `Newsletter "${newsletterName}" not found in LINKS.yaml. Available newsletters: ${newsletters
            .map((n) => `${n.pattern.name} (UID: ${n.id})`)
            .join(", ")}`
        );
      }

      // Warn if multiple newsletters with the same name exist
      const matchingNewsletters = newsletters.filter(
        (n) =>
          n.pattern.name.toLowerCase().includes(newsletterName.toLowerCase()) ||
          newsletterName.toLowerCase().includes(n.pattern.name.toLowerCase())
      );

      if (matchingNewsletters.length > 1) {
        console.warn(
          `Warning: Found ${matchingNewsletters.length} newsletters matching "${newsletterName}". ` +
          `Returning the first one (UID: ${newsletter.id}). ` +
          `To access a specific newsletter, use the uid parameter with one of: ${matchingNewsletters
            .map((n) => n.id)
            .join(", ")}`
        );
      }
    }

    return {
      name: newsletter.pattern.name,
      date: newsletter.date.toISOString(),
      uid: newsletter.id,
      subject: newsletter.subject,
      hashtags: newsletter.hashtags || [],
      links: newsletter.articles.map((article) => ({
        title: article.title,
        url: article.url,
      })),
    };
  } catch (error) {
    throw new Error(
      `Failed to get newsletter links: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
