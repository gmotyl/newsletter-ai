// CLI Pipeline - Functional composition of CLI processing steps
import { pipeAsync } from "../../utils/index.js";
import { handleCLIArgs } from "./handleCLIArgs.js";
import { handleHelpRequest } from "./handleHelpRequest.js";
import { validateCLI } from "./validateCLI.js";
import { displayWelcome } from "./displayWelcome.js";
import { displayDryRunWarning } from "./displayDryRunWarning.js";
import type { CLIOptions } from "../utils/index.js";

/**
 * CLI Pipeline - Parses, validates, and processes command line arguments
 * Uses proper FP composition with pipeAsync for left-to-right data flow
 */
export const buildCLIPipeline = async (): Promise<CLIOptions> => {
  return pipeAsync(
    handleHelpRequest,
    validateCLI,
    displayWelcome,
    displayDryRunWarning
  )(handleCLIArgs());
};
