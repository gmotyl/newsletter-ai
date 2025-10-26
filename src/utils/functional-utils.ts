// Functional utilities for composable pipelines
import curry from "lodash-es/curry.js";
import { displayError } from "../cli/utils/index.js";

export const tapAsync = curry(
  <T>(fn: (arg: T) => void | Promise<void>, arg: T): Promise<T> => {
    return Promise.resolve(fn(arg)).then(() => arg);
  }
);

export const whenAsync = curry(
  <T>(
    predicate: (arg: T) => boolean,
    fn: (arg: T) => void | Promise<void>,
    arg: T
  ): Promise<T> => {
    if (predicate(arg)) {
      return Promise.resolve(fn(arg)).then(() => arg);
    }
    return Promise.resolve(arg);
  }
);

export const exitIf = curry(
  <T>(predicate: (arg: T) => boolean, code: number, arg: T): T => {
    if (predicate(arg)) {
      process.exit(code);
    }
    return arg;
  }
);

export const validateOr = curry(
  <T>(
    predicate: (arg: T) => boolean,
    errorMsg: string | ((arg: T) => string),
    arg: T
  ): T => {
    if (!predicate(arg)) {
      const message = typeof errorMsg === "function" ? errorMsg(arg) : errorMsg;
      displayError(message);
      process.exit(1);
    }
    return arg;
  }
);
