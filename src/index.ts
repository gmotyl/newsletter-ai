// Main entry point for Newsletter AI processor
import { buildCLIPipeline } from "./cli/pipeline/index.js";
import { buildConfigPipeline } from "./config/pipeline/index.js";
import { buildNewsletterPipeline } from "./newsletter/index.js";
import { displayError } from "./cli/utils/index.js";

async function main() {
  try {
    const cliOptions = await buildCLIPipeline();
    const state = await buildConfigPipeline(cliOptions);

    // Pass the state directly to the pipeline
    // The pipeline will manage its own connections
    await buildNewsletterPipeline(state);
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
