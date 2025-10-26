// Handle help flag and display help information
import { tapAsync, exitIf } from "../../utils/index.js";
import { displayHelp, type CLIOptions } from "../utils/index.js";

export const handleHelpRequest = (cliOptions: CLIOptions): CLIOptions =>
  exitIf(
    (opts: CLIOptions) => opts.help,
    0
  )(tapAsync(() => displayHelp())(cliOptions)) as CLIOptions;
