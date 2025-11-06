// Parse command-line arguments
import type { CLIOptions } from "./types.js";

export const parseCLIArgs = (args: string[]): CLIOptions => {
  const options: CLIOptions = {
    dryRun: false,
    autoDelete: false,
    help: false,
    mode: 'default',
    // interactive is undefined by default - will be set from config or flags
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
      case "--interactive":
        options.interactive = true;
        break;
      case "--no-interactive":
        options.interactive = false;
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
      case "--mode":
        if (i + 1 < args.length) {
          const mode = args[i + 1];
          if (mode === 'default' || mode === 'prepare' || mode === 'generate') {
            options.mode = mode;
          } else {
            console.error(`Invalid mode: ${mode}. Valid modes: default, prepare, generate`);
            process.exit(1);
          }
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
