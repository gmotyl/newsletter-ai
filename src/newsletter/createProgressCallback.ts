// Create progress callback for newsletter processing
import { displayInfo } from "../cli/utils/index.js";
import type { ProgressCallback } from "../services/processor/index.js";

export const createProgressCallback =
  (): ProgressCallback => (message, step, total) => {
    if (step && total) {
      displayInfo(`[${step}/${total}] ${message}`);
    } else {
      displayInfo(message);
    }
  };
