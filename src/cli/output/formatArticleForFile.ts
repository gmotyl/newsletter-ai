// Format a single article for file output (plain text, audio-friendly)
import type { ArticleSummary } from "../../types/index.js";

export const formatArticleForFile = (article: ArticleSummary): string => {
  let output = `Artykuł: ${article.title}\n\n`;
  output += `${article.summary}\n\n`;

  if (article.keyTakeaways && article.keyTakeaways.length > 0) {
    output += `Kluczowe wnioski:\n`;
    article.keyTakeaways.forEach((item) => {
      output += `- ${item}\n`;
    });
    output += "\n";
  }

  output += `Link: ${article.url}\n`;
  output += "\n" + "─".repeat(80) + "\n\n";

  return output;
};
