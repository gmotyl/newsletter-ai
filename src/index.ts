// Main entry point for Newsletter AI processor
import { buildCLIPipeline } from "./cli/pipeline/index.js";
import { buildConfigPipeline } from "./config/pipeline/index.js";
import { buildNewsletterPipeline } from "./newsletter/index.js";
import { preparePipe } from "./newsletter/preparePipeline.js";
import { generatePipe } from "./newsletter/generatePipeline.js";
import { displayError } from "./cli/utils/index.js";

async function main() {
  try {
    const cliOptions = await buildCLIPipeline();
    const state = await buildConfigPipeline(cliOptions);

    // Route to appropriate pipeline based on mode
    const mode = cliOptions.mode || 'default';

    if (mode === 'prepare') {
      // Prepare mode: Collect newsletters and save to LINKS.yaml
      await preparePipe(state);
    } else if (mode === 'generate') {
      // Generate mode: Load from LINKS.yaml and process
      await generatePipe(state);
    } else {
      // Default mode: Full pipeline (existing behavior)
      await buildNewsletterPipeline(state);
    }
  } catch (error) {
    console.log("\n");
    displayError(
      `Fatal error: ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      console.error("\n", error.stack);
    }
    process.exit(1);
  }
}

main();
