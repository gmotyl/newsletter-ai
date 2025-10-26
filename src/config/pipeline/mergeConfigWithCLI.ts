// Merge CLI options with configuration file settings
import type { AppState, ConfiguredState } from "./types.js";
import { getInteractiveMode } from "../config.js";

export const mergeConfigWithCLI = (state: AppState): ConfiguredState => ({
  ...state,
  finalOptions: {
    ...state.processingOptions,
    dryRun: state.cliOptions.dryRun,
    autoDelete: state.cliOptions.autoDelete || state.processingOptions.autoDelete,
    interactive: state.cliOptions.interactive ?? getInteractiveMode(),
  },
  finalLLMConfig: {
    ...state.llmConfig,
    model: state.cliOptions.model || state.llmConfig.model,
  },
});
