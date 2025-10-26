// Validate CLI options
import { validateOr } from "../../utils/index.js";
import { validateCLIOptions, type CLIOptions } from "../utils/index.js";

export const validateCLI = (cliOptions: CLIOptions): CLIOptions => {
  const validation = validateCLIOptions(cliOptions);
  return validateOr(
    () => validation.valid,
    validation.valid ? "" : validation.error,
    cliOptions
  );
};
