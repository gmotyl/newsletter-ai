// Builds IMAP search criteria from newsletter pattern
// Pure function that constructs search array

import type { NewsletterPattern } from "../../types/index.js";

export const buildSearchCriteria = (pattern: NewsletterPattern): any[] => {
  const criteria: any[] = ["UNSEEN"]; // Only unread emails

  // Add FROM filter
  if (pattern.from) {
    criteria.push(["FROM", pattern.from]);
  }

  // Add SUBJECT filter (OR condition for multiple subjects)
  if (pattern.subject && pattern.subject.length > 0) {
    if (pattern.subject.length === 1) {
      criteria.push(["SUBJECT", pattern.subject[0]]);
    } else {
      // IMAP OR syntax: OR <criterion1> <criterion2>
      // For multiple subjects, we need to nest ORs: OR (OR sub1 sub2) sub3
      const subjectCriteria = pattern.subject.map((s) => ["SUBJECT", s]);

      // Build nested OR structure
      let orClause: any = subjectCriteria[0];
      for (let i = 1; i < subjectCriteria.length; i++) {
        orClause = ["OR", orClause, subjectCriteria[i]];
      }

      criteria.push(orClause);
    }
  }

  return criteria;
};
