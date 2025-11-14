// MCP Tool: prepare_newsletters
// Fetches N newsletters from IMAP, extracts/cleans links, writes to LINKS.yaml
// Reuses existing preparePipe from the prepare pipeline

import { buildConfigPipeline } from "../../config/pipeline/index.js";
import { preparePipe } from "../../newsletter/preparePipeline.js";
import type { CLIOptions } from "../../cli/utils/index.js";

interface PrepareResult {
  success: boolean;
  message: string;
  yamlPath: string;
}

/**
 * Prepare newsletters by running the existing prepare pipeline
 * @param limit - Number of newsletters to process ("all" or a number)
 * @param pattern - Optional pattern filter (newsletter name)
 * @param safeMode - If true, forces autoDelete to false (overrides config)
 */
export async function prepareNewsletters(
  limit: number | "all",
  pattern?: string,
  safeMode?: boolean
): Promise<PrepareResult> {
  try {
    // Build CLI options programmatically
    const cliOptions: CLIOptions = {
      mode: "prepare",
      messageLimit: limit === "all" ? undefined : limit,
      pattern: pattern || undefined,
      dryRun: false,
      autoDelete: safeMode ? false : undefined, // undefined = use config.json value
      help: false,
      interactive: false,
    };

    // Build config pipeline (loads config, applies CLI options)
    const state = await buildConfigPipeline(cliOptions);

    // Run the prepare pipeline (reuses existing logic)
    await preparePipe(state);

    return {
      success: true,
      message: `Successfully prepared newsletters and saved to LINKS.yaml`,
      yamlPath: "LINKS.yaml",
    };
  } catch (error) {
    throw new Error(
      `Failed to prepare newsletters: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}
