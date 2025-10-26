// Display welcome message
import { tapAsync } from "../../utils/index.js";
import { displayInfo } from "../utils/index.js";

export const displayWelcome = tapAsync(() => {
  console.log("\n");
  displayInfo("Newsletter AI - Audio-Friendly Summary Generator");
  console.log("\n");
});
