// Newsletter Pipeline Types
import type { PatternsState } from "../config/pipeline/types.js";
import type { Newsletter, EmailMetadata, ContentFilters } from "../types/index.js";
import type { processAllNewsletters } from "../services/processor/index.js";

export interface CollectedNewsletters {
  newsletters: Newsletter[];
  urls: string[][];
  metadata: EmailMetadata[];
  config: PatternsState;
  contentFilters: ContentFilters;
}

export interface ProcessedNewsletters extends CollectedNewsletters {
  summaries: Awaited<ReturnType<typeof processAllNewsletters>>;
}
