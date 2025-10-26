// Display summary to console
import type { Summary } from "../../types/index.js";
import { formatSummaryForDisplay } from "./formatSummaryForDisplay.js";

export const displaySummary = (summary: Summary): void => {
  const formatted = formatSummaryForDisplay(summary);
  console.log(formatted);
};

export const displaySummaries = (summaries: Summary[]): void => {
  summaries.forEach((summary) => {
    displaySummary(summary);
    console.log("\n");
  });
};
