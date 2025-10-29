// Vitest setup file - loads test environment variables
import { config } from "dotenv";
import { resolve } from "path";

// Load .env.test file for test environment
// Override any existing env vars to ensure test consistency
config({ path: resolve(__dirname, ".env.test"), override: true });
