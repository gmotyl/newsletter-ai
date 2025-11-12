import * as cheerio from 'cheerio';
import { displayVerbose } from "../../cli/utils/index.js";

/**
 * Extracts the actual article URL from meta tags
 * Checks: og:url, canonical, article:url, twitter:url
 */
export const extractUrlFromMeta = async (
  url: string,
  timeout: number = 15000,
  userAgent: string = 'Mozilla/5.0 (compatible; NewsletterBot/1.0)'
): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    displayVerbose(`      → Fetching page for meta tag extraction: ${url}`);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      displayVerbose(`      ⚠ Failed to fetch page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Priority order for meta tags
    const metaSelectors = [
      { selector: 'meta[property="og:url"]', attr: 'content', name: 'og:url' },
      { selector: 'link[rel="canonical"]', attr: 'href', name: 'canonical' },
      { selector: 'meta[property="article:url"]', attr: 'content', name: 'article:url' },
      { selector: 'meta[name="twitter:url"]', attr: 'content', name: 'twitter:url' },
      { selector: 'meta[property="twitter:url"]', attr: 'content', name: 'twitter:url (property)' },
    ];

    for (const { selector, attr, name } of metaSelectors) {
      const element = $(selector);
      if (element.length) {
        const content = element.attr(attr);
        if (content) {
          // Validate URL format
          try {
            // Resolve relative URLs against the base URL
            const resolvedUrl = new URL(content, url).href;

            // Don't return the same URL (avoid self-reference)
            if (resolvedUrl !== url) {
              displayVerbose(`      ✓ Found URL in ${name}: ${resolvedUrl}`);
              return resolvedUrl;
            }
          } catch (error) {
            displayVerbose(`      ⚠ Invalid URL in ${name}: ${content}`);
          }
        }
      }
    }

    // Fallback: Look for common article link patterns in the HTML
    const articleLinkSelectors = [
      'a[data-tracking-control-name="external_url_click"]', // LinkedIn warning page
      'a[rel="external"]',
      'a.article-link',
      'a.external-link',
      'a[data-type="article"]',
      'a[href*="/r/"]', // Common redirect pattern
    ];

    for (const linkSelector of articleLinkSelectors) {
      const link = $(linkSelector).first();
      if (link.length) {
        const href = link.attr('href');
        if (href) {
          try {
            const resolvedUrl = new URL(href, url).href;
            if (resolvedUrl !== url) {
              displayVerbose(`      ✓ Found article link via selector "${linkSelector}": ${resolvedUrl}`);
              return resolvedUrl;
            }
          } catch (error) {
            // Invalid href, continue to next selector
          }
        }
      }
    }

    displayVerbose(`      ⚠ No article URL found in meta tags or common selectors`);
    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      displayVerbose(`      ⚠ Meta tag extraction timed out after ${timeout}ms`);
    } else {
      displayVerbose(`      ⚠ Error extracting meta tags: ${error.message}`);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * Extracts URL from a specific DOM selector
 */
export const extractUrlFromSelector = async (
  url: string,
  selector: string,
  timeout: number = 15000,
  userAgent: string = 'Mozilla/5.0 (compatible; NewsletterBot/1.0)'
): Promise<string | null> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    displayVerbose(`      → Fetching page for DOM selector extraction: ${url}`);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml',
      },
    });

    if (!response.ok) {
      displayVerbose(`      ⚠ Failed to fetch page: ${response.status}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const element = $(selector).first();
    if (element.length) {
      // Try to get href attribute first
      let extractedUrl = element.attr('href');

      // If no href, try to get text content that might be a URL
      if (!extractedUrl && element.text()) {
        const text = element.text().trim();
        if (text.startsWith('http')) {
          extractedUrl = text;
        }
      }

      // If still no URL, try data attributes
      if (!extractedUrl) {
        const dataAttrs = ['data-url', 'data-href', 'data-link', 'data-article-url'];
        for (const attr of dataAttrs) {
          extractedUrl = element.attr(attr);
          if (extractedUrl) break;
        }
      }

      if (extractedUrl) {
        try {
          const resolvedUrl = new URL(extractedUrl, url).href;
          if (resolvedUrl !== url) {
            displayVerbose(`      ✓ Found URL via selector "${selector}": ${resolvedUrl}`);
            return resolvedUrl;
          }
        } catch (error) {
          displayVerbose(`      ⚠ Invalid URL from selector: ${extractedUrl}`);
        }
      }
    } else {
      displayVerbose(`      ⚠ No element found for selector: ${selector}`);
    }

    return null;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      displayVerbose(`      ⚠ Selector extraction timed out after ${timeout}ms`);
    } else {
      displayVerbose(`      ⚠ Error extracting from selector: ${error.message}`);
    }
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};