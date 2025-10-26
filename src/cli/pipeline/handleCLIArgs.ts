// Parse command line arguments
import { parseCLIArgs, type CLIOptions } from "../utils/index.js";

export const handleCLIArgs = (): CLIOptions =>
  parseCLIArgs(process.argv.slice(2));
