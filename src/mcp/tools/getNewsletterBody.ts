// MCP Tool: get_newsletter_body
// Returns the raw email body (HTML and text) for a specific newsletter from LINKS.yaml

import { loadLinksFromYaml } from "../../utils/yaml.js";

interface NewsletterBodyResult {
  name: string;
  date: string;
  uid: string;
  subject?: string;
  bodyHtml?: string;
  bodyText?: string;
}

export async function getNewsletterBody(
  uid: string,
  yamlPath: string = "LINKS.yaml"
): Promise<NewsletterBodyResult> {
  try {
    const newsletters = await loadLinksFromYaml(yamlPath);

    // Find newsletter by UID
    const newsletter = newsletters.find((n) => n.id === uid);

    if (!newsletter) {
      throw new Error(
        `Newsletter with UID "${uid}" not found in LINKS.yaml. Available UIDs: ${newsletters
          .map((n) => `${n.pattern.name} (${n.id})`)
          .join(", ")}`
      );
    }

    // Check if body data is available
    if (!newsletter.bodyHtml && !newsletter.bodyText) {
      throw new Error(
        `Newsletter body not available for UID "${uid}". The newsletter may have been processed before body storage was implemented.`
      );
    }

    return {
      name: newsletter.pattern.name,
      date: newsletter.date.toISOString(),
      uid: newsletter.id,
      subject: newsletter.subject,
      bodyHtml: newsletter.bodyHtml,
      bodyText: newsletter.bodyText,
    };
  } catch (error) {
    throw new Error(
      `Failed to get newsletter body: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
