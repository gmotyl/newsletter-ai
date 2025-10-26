// Format complete summary for file output
import type { Summary } from "../../types/index.js";
import { formatAllArticles } from "./formatAllArticles.js";

export const formatSummaryForFile = (summary: Summary): string => {
  let output = "";
  output += "=".repeat(80) + "\n";
  output += `Newsletter: ${summary.newsletter}\n`;
  output += `Data: ${summary.date.toLocaleDateString("pl-PL")}\n`;
  output += `Liczba artykułów: ${summary.articles.length}\n`;
  output += "=".repeat(80) + "\n\n";

  output += formatAllArticles(summary.articles);

  output += "\n" + "=".repeat(80) + "\n";
  output += `Wygenerowano: ${new Date().toLocaleString("pl-PL")}\n`;
  output += "=".repeat(80) + "\n";

  return output;
};
