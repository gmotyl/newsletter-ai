// Validate email and LLM API credentials
import { validateOr } from "../../utils/index.js";
import type { ConfiguredState } from "./types.js";

export const validateCredentials = (state: ConfiguredState): ConfiguredState => {
  const withEmailValidation = validateOr(
    (s: ConfiguredState) => Boolean(s.emailCredentials.user && s.emailCredentials.password),
    "Missing email credentials. Check your .env file.",
    state
  );

  return validateOr(
    (s: ConfiguredState) => Boolean(s.finalLLMConfig.apiKey),
    "Missing LLM API key. Check your .env file.",
    withEmailValidation
  );
};
