// Parse command-line arguments
import type { CLIOptions } from "./types.js";

export const parseCLIArgs = (args: string[]): CLIOptions => {
  const options: CLIOptions = {
    dryRun: false,
    autoDelete: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--auto-delete":
        options.autoDelete = true;
        break;
      case "--pattern":
        if (i + 1 < args.length) {
          options.pattern = args[i + 1];
          i++; // Skip next arg
        }
        break;
      case "--model":
        if (i + 1 < args.length) {
          options.model = args[i + 1];
          i++; // Skip next arg
        }
        break;
      case "--help":
      case "-h":
        options.help = true;
        break;
    }
  }

  return options;
};
