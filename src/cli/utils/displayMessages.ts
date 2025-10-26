// Display various message types
import { formatError, formatSuccess, formatInfo, formatWarning } from "./formatMessages.js";
import { formatHelpText } from "./formatHelpText.js";
import { getVerboseMode } from "../../config/config.js";

export const displayError = (message: string): void => {
  console.error(formatError(message));
};

export const displaySuccess = (message: string): void => {
  console.log(formatSuccess(message));
};

export const displayInfo = (message: string): void => {
  console.log(formatInfo(message));
};

export const displayWarning = (message: string): void => {
  console.log(formatWarning(message));
};

export const displayHelp = (): void => {
  console.log(formatHelpText());
};

export const clearConsole = (): void => {
  console.clear();
};

export const displayVerbose = (message: string): void => {
  if (getVerboseMode()) {
    console.log(formatInfo(message));
  }
};
