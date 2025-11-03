import type { ResolvedUrl, ScraperOptions } from "../../types/index.js";
import { followRedirect } from "./followRedirect.js";
import { extractUrlFromMeta, extractUrlFromSelector } from "./extractUrlFromMeta.js";
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * Resolves a potentially nested URL to the actual article URL
 * Strategies:
 * - redirect: Follow HTTP redirects (most reliable for daily.dev)
 * - meta-tags: Parse og:url, canonical, or other meta tags
 * - dom-selector: Use CSS selector to find article link
 * - auto: Try redirect first, fallback to meta-tags
 */
export const resolveUrl = async (
  url: string,
  strategy: "redirect" | "meta-tags" | "dom-selector" | "auto" = "auto",
  selector?: string,
  maxDepth: number = 1,
  scraperOptions?: ScraperOptions
): Promise<ResolvedUrl> => {
  const result: ResolvedUrl = {
    originalUrl: url,
    finalUrl: url,
    isNested: false,
  };

  // Early return if we've reached max depth
  if (maxDepth <= 0) {
    displayVerbose(`      ⚠ Max resolution depth reached`);
    return result;
  }

  // Extract options with defaults
  const userAgent = scraperOptions?.userAgent || 'Mozilla/5.0 (compatible; NewsletterBot/1.0)';
  const nestedOptions = scraperOptions?.nestedScraping;
  const maxRedirects = nestedOptions?.maxRedirects || 5;
  const timeout = nestedOptions?.timeout || 15000;
  const followRedirects = nestedOptions?.followRedirects !== false; // Default true

  try {
    displayVerbose(`    ⚡ Resolving URL with strategy: ${strategy}`);

    // Strategy 1: Redirect following
    if ((strategy === "redirect" || strategy === "auto") && followRedirects) {
      displayVerbose(`      Trying redirect resolution...`);
      const { finalUrl, redirectChain } = await followRedirect(
        url,
        maxRedirects,
        timeout,
        userAgent
      );

      if (finalUrl !== url) {
        result.finalUrl = finalUrl;
        result.isNested = true;
        result.redirectChain = redirectChain;

        // Log redirect chain if verbose
        if (redirectChain.length > 1) {
          const chain = redirectChain.map((u, i) =>
            i === 0 ? u : `  ${'→'.repeat(i)} ${u}`
          ).join('\n');
          displayVerbose(`      Redirect chain:\n${chain}`);
        }

        return result;
      }

      if (strategy === "redirect") {
        // If redirect was explicitly requested but no redirect found
        displayVerbose(`      No redirects found for URL`);
        return result;
      }
    }

    // Strategy 2: Meta tag extraction
    if (strategy === "meta-tags" || strategy === "auto") {
      displayVerbose(`      Trying meta tag extraction...`);
      const metaUrl = await extractUrlFromMeta(url, timeout, userAgent);

      if (metaUrl && metaUrl !== url) {
        result.finalUrl = metaUrl;
        result.isNested = true;

        // If we found a URL via meta tags, we might want to follow its redirects too
        if (maxDepth > 1 && followRedirects) {
          displayVerbose(`      Following redirects from meta URL...`);
          const nestedResult = await resolveUrl(
            metaUrl,
            "redirect",
            undefined,
            maxDepth - 1,
            scraperOptions
          );

          if (nestedResult.isNested) {
            result.finalUrl = nestedResult.finalUrl;
            // Combine redirect chains
            result.redirectChain = [url, metaUrl, ...(nestedResult.redirectChain || []).slice(1)];
          }
        }

        return result;
      }

      if (strategy === "meta-tags") {
        displayVerbose(`      No article URL found in meta tags`);
        return result;
      }
    }

    // Strategy 3: DOM selector
    if ((strategy === "dom-selector" || (strategy === "auto" && selector)) && selector) {
      displayVerbose(`      Trying DOM selector extraction with: ${selector}`);
      const domUrl = await extractUrlFromSelector(url, selector, timeout, userAgent);

      if (domUrl && domUrl !== url) {
        result.finalUrl = domUrl;
        result.isNested = true;

        // Follow redirects from DOM-extracted URL if needed
        if (maxDepth > 1 && followRedirects) {
          displayVerbose(`      Following redirects from DOM-extracted URL...`);
          const nestedResult = await resolveUrl(
            domUrl,
            "redirect",
            undefined,
            maxDepth - 1,
            scraperOptions
          );

          if (nestedResult.isNested) {
            result.finalUrl = nestedResult.finalUrl;
            result.redirectChain = [url, domUrl, ...(nestedResult.redirectChain || []).slice(1)];
          }
        }

        return result;
      }
    }

    // No resolution found
    if (result.finalUrl === url) {
      displayVerbose(`      ℹ No nested URL found, using original`);
    }

    return result;
  } catch (error: any) {
    displayVerbose(`      ⚠ URL resolution failed: ${error.message}`);
    // Return original URL on error
    return result;
  }
};

/**
 * Cache for resolved URLs within a session
 * Helps avoid redundant resolution of the same intermediate URLs
 */
const resolvedUrlCache = new Map<string, ResolvedUrl>();

/**
 * Resolves URL with caching to avoid redundant resolutions
 */
export const resolveUrlWithCache = async (
  url: string,
  strategy: "redirect" | "meta-tags" | "dom-selector" | "auto" = "auto",
  selector?: string,
  maxDepth: number = 1,
  scraperOptions?: ScraperOptions
): Promise<ResolvedUrl> => {
  // Check cache first
  const cacheKey = `${url}:${strategy}:${selector || ''}`;
  if (resolvedUrlCache.has(cacheKey)) {
    displayVerbose(`    ♻ Using cached resolution for: ${url}`);
    return resolvedUrlCache.get(cacheKey)!;
  }

  // Resolve URL
  const result = await resolveUrl(url, strategy, selector, maxDepth, scraperOptions);

  // Cache the result
  resolvedUrlCache.set(cacheKey, result);

  // Limit cache size to prevent memory issues
  if (resolvedUrlCache.size > 100) {
    // Remove oldest entries (FIFO)
    const firstKey = resolvedUrlCache.keys().next().value;
    if (firstKey) {
      resolvedUrlCache.delete(firstKey);
    }
  }

  return result;
};

/**
 * Clears the resolved URL cache
 * Useful between newsletter processing sessions
 */
export const clearResolvedUrlCache = (): void => {
  resolvedUrlCache.clear();
  displayVerbose(`    ♻ Cleared resolved URL cache`);
};