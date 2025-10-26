// Check if a file exists
import { existsSync } from "fs";

export const fileExists = (filepath: string): boolean => {
  return existsSync(filepath);
};
