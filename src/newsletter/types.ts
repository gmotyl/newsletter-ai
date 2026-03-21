// Newsletter Pipeline Types
import type { PatternsState } from "../config/pipeline/types.js";
import type { Newsletter, EmailMetadata, ContentFilters } from "../types/index.js";

export interface CollectedNewsletters {
  newsletters: Newsletter[];
  urls: string[][];
  metadata: EmailMetadata[];
  config: PatternsState;
  contentFilters: ContentFilters;
}
