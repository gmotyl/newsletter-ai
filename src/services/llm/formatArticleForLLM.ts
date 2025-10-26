// Formats a single article for LLM consumption
// Pure function - same input = same output

import type { Article } from "../../types/index.js";

export const formatArticleForLLM = (article: Article): string => {
  return `## ${article.title}

**URL**: ${article.url}

**Content**:
${article.content.substring(0, 3000)}${article.content.length > 3000 ? "..." : ""}

---`;
};
