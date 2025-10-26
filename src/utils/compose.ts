// Functional composition utilities for building pipelines

/**
 * Composes functions from right to left (standard FP composition)
 * @example compose(f, g, h)(x) === f(g(h(x)))
 */
export const compose =
  <T>(...fns: Array<(arg: any) => any>) =>
  (initialValue: T): any =>
    fns.reduceRight((acc, fn) => fn(acc), initialValue);

/**
 * Composes async functions from right to left
 * @example composeAsync(f, g, h)(x) === await f(await g(await h(x)))
 */
export const composeAsync =
  <T>(...fns: Array<(arg: any) => any | Promise<any>>) =>
  async (initialValue: T): Promise<any> =>
    fns.reduceRight(
      (acc, fn) => acc.then((value: any) => Promise.resolve(fn(value))),
      Promise.resolve(initialValue)
    );

/**
 * Pipes functions from left to right (more intuitive for pipelines)
 * @example pipe(h, g, f)(x) === f(g(h(x)))
 */
export const pipe =
  <T>(...fns: Array<(arg: any) => any>) =>
  (initialValue: T): any =>
    fns.reduce((acc, fn) => fn(acc), initialValue);

/**
 * Pipes async functions from left to right
 * @example pipeAsync(h, g, f)(x) === await f(await g(await h(x)))
 */
export const pipeAsync =
  (...fns: Array<(arg: any) => any | Promise<any>>) =>
  async (initialValue: any): Promise<any> =>
    fns.reduce(
      (acc, fn) => acc.then((value: any) => Promise.resolve(fn(value))),
      Promise.resolve(initialValue)
    );
