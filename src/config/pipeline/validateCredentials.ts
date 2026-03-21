// Validate email credentials
import { validateOr } from "../../utils/index.js";
import type { ConfiguredState } from "./types.js";

export const validateCredentials = (state: ConfiguredState): ConfiguredState => {
  return validateOr(
    (s: ConfiguredState) => Boolean(s.emailCredentials.user && s.emailCredentials.password),
    "Missing email credentials. Check your .env file.",
    state
  );
};
