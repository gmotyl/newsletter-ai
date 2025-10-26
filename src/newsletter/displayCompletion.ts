// Display completion message
import { tapAsync } from "../utils/index.js";
import { displaySuccess } from "../cli/utils/index.js";

export const displayCompletion = tapAsync(() => {
  console.log("\n");
  displaySuccess("Processing complete!");
});
