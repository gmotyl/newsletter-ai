// MCP Tool: get_newsletters_list
// Returns list of newsletters from LINKS.yaml

import { loadLinksFromYaml } from "../../utils/yaml.js";
import type { Newsletter } from "../../types/index.js";

interface NewsletterListItem {
  name: string;
  date: string;
  linkCount: number;
  uid?: string;
}

export async function getNewslettersList(
  yamlPath: string = "LINKS.yaml"
): Promise<NewsletterListItem[]> {
  try {
    const newsletters = await loadLinksFromYaml(yamlPath);

    return newsletters.map((newsletter: Newsletter) => ({
      name: newsletter.pattern.name,
      date: newsletter.date.toISOString(),
      linkCount: newsletter.articles.length,
      uid: newsletter.id,
    }));
  } catch (error) {
    throw new Error(
      `Failed to load newsletters from YAML: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
