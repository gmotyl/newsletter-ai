// Configuration Pipeline - Functional composition of configuration steps
import { pipeAsync } from "../../utils/index.js";
import { loadConfiguration } from "./loadConfiguration.js";
import { mergeConfigWithCLI } from "./mergeConfigWithCLI.js";
import { validateCredentials } from "./validateCredentials.js";
import { getEnabledPatterns } from "./getEnabledPatterns.js";
import { filterPatternsByName } from "./filterPatternsByName.js";
import { displayPatterns } from "./displayPatterns.js";

/**
 * Configuration Pipeline - Loads, validates, and prepares application state
 * Uses proper FP composition with pipeAsync for left-to-right data flow
 */
export const buildConfigPipeline = pipeAsync(
  loadConfiguration,
  mergeConfigWithCLI,
  validateCredentials,
  getEnabledPatterns,
  filterPatternsByName,
  displayPatterns
);
