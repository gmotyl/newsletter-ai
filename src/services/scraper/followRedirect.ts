import { displayVerbose } from "../../cli/utils/index.js";

/**
 * Follows HTTP redirects and returns the final URL
 * Uses fetch with redirect: 'manual' to track redirect chain
 */
export const followRedirect = async (
  url: string,
  maxRedirects: number = 5,
  timeout: number = 15000,
  userAgent: string = 'Mozilla/5.0 (compatible; NewsletterBot/1.0)'
): Promise<{ finalUrl: string; redirectChain: string[] }> => {
  const redirectChain: string[] = [url];
  let currentUrl = url;
  let redirectCount = 0;
  const visitedUrls = new Set<string>();
  visitedUrls.add(url);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    while (redirectCount < maxRedirects) {
      displayVerbose(`      → Checking redirect for: ${currentUrl}`);

      // Try HEAD first for efficiency, but fallback to GET if it fails
      let response = await fetch(currentUrl, {
        method: 'HEAD', // HEAD is faster than GET for redirect checking
        redirect: 'manual', // Don't follow redirects automatically
        signal: controller.signal,
        headers: {
          'User-Agent': userAgent,
          'Accept': '*/*',
        },
      });

      // Some tracking links (like daily.dev) return 404 for HEAD but work with GET
      if (response.status === 404 || response.status === 405) {
        displayVerbose(`      ⚠ HEAD request failed (${response.status}), retrying with GET...`);
        response = await fetch(currentUrl, {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            'User-Agent': userAgent,
            'Accept': '*/*',
          },
        });
      }

      // Check if it's a redirect (3xx status codes)
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');

        if (!location) {
          displayVerbose(`      ⚠ Redirect response without location header`);
          break;
        }

        // Handle relative URLs by resolving against current URL
        try {
          currentUrl = new URL(location, currentUrl).href;
        } catch (error) {
          displayVerbose(`      ⚠ Invalid redirect location: ${location}`);
          break;
        }

        // Check for circular redirects
        if (visitedUrls.has(currentUrl)) {
          displayVerbose(`      ⚠ Circular redirect detected: ${currentUrl}`);
          break;
        }

        visitedUrls.add(currentUrl);
        redirectChain.push(currentUrl);
        redirectCount++;

        displayVerbose(`      ↳ Redirected to: ${currentUrl} (${response.status})`);
      } else if (response.status >= 200 && response.status < 300) {
        // Success - no more redirects
        displayVerbose(`      ✓ Final URL reached: ${currentUrl}`);
        break;
      } else {
        // Non-redirect, non-success status
        displayVerbose(`      ⚠ Unexpected status ${response.status} for ${currentUrl}`);
        break;
      }
    }

    if (redirectCount >= maxRedirects) {
      displayVerbose(`      ⚠ Maximum redirects (${maxRedirects}) reached`);
    }

    return {
      finalUrl: currentUrl,
      redirectChain,
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      displayVerbose(`      ⚠ Redirect following timed out after ${timeout}ms`);
    } else {
      displayVerbose(`      ⚠ Error following redirect: ${error.message}`);
    }

    // Return the last known URL on error
    return {
      finalUrl: currentUrl,
      redirectChain,
    };
  } finally {
    clearTimeout(timeoutId);
  }
};