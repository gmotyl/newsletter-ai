// Extracts article summaries from LLM response
// Pure function - parses structured text into objects

import type { ArticleSummary } from "../../types/index.js";

export const parseLLMResponse = (response: string): ArticleSummary[] => {
  const articles: ArticleSummary[] = [];

  // Split by article boundaries (markdown headers or separator lines)
  const sections = response.split(/\n(?=##\s)|---/).filter((s) => s.trim());

  for (const section of sections) {
    const titleMatch = section.match(/##\s+(.+?)(?:\n|$)/);
    const urlMatch = section.match(/(?:Link|URL):\s*(.+?)(?:\n|$)/i);

    if (!titleMatch) continue;

    const title = titleMatch[1].trim();
    const url = urlMatch ? urlMatch[1].trim() : "";

    // Extract key takeaways (bullet points)
    const takeawaysMatch = section.match(
      /(?:Kluczowe wnioski|Key takeaways):([\s\S]*?)(?=\n##|\n---|\nLink:|$)/i
    );
    const keyTakeaways: string[] = [];

    if (takeawaysMatch) {
      const takeawaysText = takeawaysMatch[1];
      const bullets = takeawaysText.match(/[-•*]\s+(.+)/g);
      if (bullets) {
        keyTakeaways.push(
          ...bullets.map((b) => b.replace(/^[-•*]\s+/, "").trim())
        );
      }
    }

    // Extract summary (everything between title and takeaways/link)
    const summaryMatch = section.match(
      /##\s+.+?\n([\s\S]*?)(?=\n(?:Kluczowe wnioski|Key takeaways|Link:|URL:)|$)/i
    );
    const summary = summaryMatch ? summaryMatch[1].trim() : "";

    articles.push({
      title,
      summary,
      keyTakeaways,
      url,
    });
  }

  return articles;
};
