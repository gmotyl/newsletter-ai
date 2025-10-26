// Generate full file path
import { join } from "path";

export const generateFilePath = (
  outputDir: string,
  filename: string
): string => {
  return join(outputDir, filename);
};
