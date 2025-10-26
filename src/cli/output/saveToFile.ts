// Save content to file
import { writeFile } from "fs/promises";

export const saveToFile = async (
  content: string,
  filepath: string
): Promise<void> => {
  await writeFile(filepath, content, "utf-8");
};
