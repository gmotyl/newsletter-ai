// Display dry run warning if enabled
import { whenAsync } from "../../utils/index.js";
import { displayWarning, type CLIOptions } from "../utils/index.js";

export const displayDryRunWarning = whenAsync(
  (opts: CLIOptions) => opts.dryRun,
  () => {
    displayWarning(
      "DRY-RUN MODE: Emails will NOT be marked as read or deleted"
    );
    console.log("\n");
  }
);
