// Merge prepare options with configuration file settings
import type { AppState, ConfiguredState } from "./types.js";

export const mergeConfigWithCLI = (state: AppState): ConfiguredState => ({
  ...state,
  finalOptions: {
    ...state.processingOptions,
    dryRun: state.prepareOptions.dryRun,
    autoDelete: state.prepareOptions.autoDelete ?? state.processingOptions.autoDelete,
    messageLimit: state.prepareOptions.messageLimit ?? state.processingOptions.messageLimit,
    processAllMessages: state.processingOptions.processAllMessages,
    markAsRead: state.processingOptions.markAsRead,
  },
});
