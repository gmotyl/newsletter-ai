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
  links: NewsletterLink[];
}

export async function getNewsletterLinks(
  newsletterName: string,
  yamlPath: string = "LINKS.yaml"
): Promise<NewsletterLinksResult> {
  try {
    const newsletters = await loadLinksFromYaml(yamlPath);

    // Find newsletter by name (case-insensitive partial match)
    const newsletter = newsletters.find(
      (n) =>
        n.pattern.name.toLowerCase().includes(newsletterName.toLowerCase()) ||
        newsletterName.toLowerCase().includes(n.pattern.name.toLowerCase())
    );

    if (!newsletter) {
      throw new Error(
        `Newsletter "${newsletterName}" not found in LINKS.yaml. Available newsletters: ${newsletters
          .map((n) => n.pattern.name)
          .join(", ")}`
      );
    }

    return {
      name: newsletter.pattern.name,
      date: newsletter.date.toISOString(),
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
