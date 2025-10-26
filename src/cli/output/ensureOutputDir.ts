// Ensure output directory exists
import { mkdir } from "fs/promises";
import { existsSync } from "fs";

export const ensureOutputDir = async (outputDir: string): Promise<void> => {
  if (!existsSync(outputDir)) {
    await mkdir(outputDir, { recursive: true });
  }
};
