// Formats a newsletter object for LLM processing
// Pure function

import type { Article } from "../../types/index.js";
import { formatArticlesForLLM } from "./formatArticlesForLLM.js";

export const formatNewsletterForLLM = (newsletter: {
  name: string;
  date: Date;
  articles: Article[];
  hashtags?: string[];
}): string => {
  const dateStr = newsletter.date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hashtagsStr = newsletter.hashtags && newsletter.hashtags.length > 0
    ? `Newsletter Hashtags: ${newsletter.hashtags.join(' ')}\n`
    : '';

  return `# ${newsletter.name} - ${dateStr}
${hashtagsStr}
${formatArticlesForLLM(newsletter.articles)}`;
};
