// Get default output directory
import { getOutputPath } from "../../config/config.js";

export const getDefaultOutputDir = (): string => {
  return getOutputPath();
};
