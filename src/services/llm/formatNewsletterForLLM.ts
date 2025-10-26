// Formats a newsletter object for LLM processing
// Pure function

import type { Article } from "../../types/index.js";
import { formatArticlesForLLM } from "./formatArticlesForLLM.js";

export const formatNewsletterForLLM = (newsletter: {
  name: string;
  date: Date;
  articles: Article[];
}): string => {
  const dateStr = newsletter.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `# ${newsletter.name} - ${dateStr}

${formatArticlesForLLM(newsletter.articles)}`;
};
