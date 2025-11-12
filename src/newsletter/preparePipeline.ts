// Prepare Pipeline - Collect newsletters and save links to YAML
import { pipeAsync } from "../utils/index.js";
import { searchAndCollectNewsletters } from "./searchAndCollectNewsletters.js";
import { exitIfNoNewsletters } from "./exitIfNoNewsletters.js";
import { saveLinksToYaml } from "../utils/yaml.js";
import {
  displaySuccess,
  displayInfo,
  displayProgress,
  displayVerbose,
} from "../cli/utils/index.js";
import { resolveUrlWithCache } from "../services/scraper/resolveUrl.js";
import { extract } from "@extractus/article-extractor";
import pLimit from "p-limit";
import type { PatternsState } from "../config/pipeline/types.js";
import type { CollectedNewsletters } from "./types.js";
import type { Newsletter, Article, NewsletterPattern, ScraperOptions, AppConfig } from "../types/index.js";

/**
 * Get nested scraping configuration from newsletter pattern
 * Returns defaults if not configured
 */
function getNestedScrapingConfig(pattern: NewsletterPattern) {
  return {
    strategy: pattern.nestedScraping?.strategy || ("redirect" as const),
    maxDepth: pattern.nestedScraping?.maxDepth || 2,
    selector: pattern.nestedScraping?.selector,
  };
}

/**
 * Resolve URL using newsletter pattern's nested scraping configuration
 * Wrapper around resolveUrlWithCache that extracts config from pattern
 */
async function resolveWithPatternConfig(
  url: string,
  pattern: NewsletterPattern,
  scraperOptions?: ScraperOptions
) {
  const { strategy, maxDepth, selector } = getNestedScrapingConfig(pattern);
  return await resolveUrlWithCache(url, strategy, selector, maxDepth, scraperOptions);
}

/**
 * Try to decode tracking URLs that have base64-encoded actual URLs
 * Common patterns:
 * - kit-mail6.com: Last path segment is base64-encoded URL
 * - click.convertkit-mail.com: Similar pattern
 */
function tryDecodeTrackingUrl(url: string): string {
  try {
    const urlObj = new URL(url);

    // Check for known tracking domains
    const trackingDomains = [
      "kit-mail6.com",
      "kit-mail.com",
      "convertkit-mail.com",
      "click.convertkit-mail.com",
    ];

    const isTrackingDomain = trackingDomains.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    if (!isTrackingDomain) {
      return url;
    }

    // Get the last path segment (most likely to be base64)
    const pathParts = urlObj.pathname.split("/").filter((p) => p);
    if (pathParts.length === 0) {
      return url;
    }

    const lastSegment = pathParts[pathParts.length - 1];

    // Try to decode as base64
    try {
      const decoded = Buffer.from(lastSegment, "base64").toString("utf-8");

      // Check if decoded string is a valid URL
      if (decoded.startsWith("http://") || decoded.startsWith("https://")) {
        return decoded;
      }
    } catch {
      // Not valid base64 or not a URL
    }

    return url;
  } catch {
    return url;
  }
}

/**
 * Convert raw URLs to Article objects (with URL as title initially)
 * This allows us to use the same filtering functions throughout the pipeline
 */
const convertUrlsToArticles = (
  state: CollectedNewsletters
): CollectedNewsletters => {
  const spinner = displayProgress("Converting URLs to articles...");

  const newslettersWithArticles = state.newsletters.map((newsletter, index) => {
    const urls = state.urls[index] || [];
    const articles: Article[] = urls.map((url) => ({
      title: url, // Temporary title, will be enriched later
      url: url,
      content: "",
    }));

    displayVerbose(
      `  → Converted ${urls.length} URLs to articles for ${newsletter.pattern.name}`
    );

    return {
      ...newsletter,
      articles,
    };
  });

  spinner.succeed(`Converted URLs to articles for ${state.newsletters.length} newsletters`);

  return {
    ...state,
    newsletters: newslettersWithArticles,
    urls: [], // Clear urls as we now have articles
  };
};

/**
 * Clean and enrich links: resolve redirects, fetch titles, filter marketing
 */
const cleanAndEnrichLinks = async (
  state: CollectedNewsletters
): Promise<CollectedNewsletters> => {
  const spinner = displayProgress("Cleaning and enriching links...");

  // Track filtering stats
  let stats = {
    total: 0,
    kept: 0,
    sponsored: 0,
    social: 0,
    tracking: 0,
    bonus: 0,
    youtube: 0,
    errors: 0,
  };

  // Process newsletters in parallel with concurrency limit
  const limit = pLimit(5); // Process 5 newsletters at a time

  // Collections for special link types
  const bonusLinks: Article[] = [];
  const youtubeLinks: Article[] = [];
  const seenUrls = new Set<string>(); // Track duplicates

  const enrichedNewsletters = await Promise.all(
    state.newsletters.map((newsletter) =>
      limit(async () => {
        const inputArticles = newsletter.articles || [];
        const articles: Article[] = [];

        displayVerbose(
          `\nProcessing ${newsletter.pattern.name} (${inputArticles.length} links)...`
        );

        for (const article of inputArticles) {
          const url = article.url;
          stats.total++;

          try {
            // 1. Categorize the link
            const category = categorizeLink(url, state.config.appConfig);

            if (category === "tracking") {
              stats.tracking++;
              displayVerbose(`  ✗ Tracking link: ${url}`);
              continue;
            }

            if (category === "social") {
              stats.social++;
              displayVerbose(`  ✗ Social link: ${url}`);
              continue;
            }

            if (category === "sponsored") {
              stats.sponsored++;
              displayVerbose(`  ✗ Sponsored/marketing link: ${url}`);
              continue;
            }

            if (category === "bonus") {
              stats.bonus++;
              displayVerbose(`  📚 Bonus resource: ${url}`);

              // Resolve and add to bonus collection
              const resolved = await resolveWithPatternConfig(
                url,
                newsletter.pattern,
                state.config.appConfig.scraperOptions
              );
              let finalUrl = resolved.finalUrl;
              finalUrl = stripTrackingParams(finalUrl);

              if (!seenUrls.has(finalUrl)) {
                seenUrls.add(finalUrl);
                const title = extractTitleFromUrl(finalUrl);
                bonusLinks.push({ title, url: finalUrl, content: "" });
              }
              continue;
            }

            if (category === "youtube") {
              stats.youtube++;
              displayVerbose(`  📺 YouTube content: ${url}`);

              // Resolve and add to YouTube collection
              const resolved = await resolveWithPatternConfig(
                url,
                newsletter.pattern,
                state.config.appConfig.scraperOptions
              );
              let finalUrl = resolved.finalUrl;
              finalUrl = stripTrackingParams(finalUrl);

              if (!seenUrls.has(finalUrl)) {
                seenUrls.add(finalUrl);
                const title = extractTitleFromUrl(finalUrl);
                youtubeLinks.push({ title, url: finalUrl, content: "" });
              }
              continue;
            }

            // 2. Try to decode base64-encoded URLs in tracking links first
            let urlToResolve = url;
            const decodedUrl = tryDecodeTrackingUrl(url);
            if (decodedUrl && decodedUrl !== url) {
              displayVerbose(
                `  🔓 Decoded tracking URL: ${url} → ${decodedUrl}`
              );
              urlToResolve = decodedUrl;
            }

            // 3. Resolve redirects to get final URL
            // Use pattern's nestedScraping config if available, otherwise defaults
            const resolved = await resolveWithPatternConfig(
              urlToResolve,
              newsletter.pattern,
              state.config.appConfig.scraperOptions
            );

            let finalUrl = resolved.finalUrl;

            // 3. Strip UTM and tracking parameters from final URL
            finalUrl = stripTrackingParams(finalUrl);

            // 4. Check final URL category too
            const finalCategory = categorizeLink(finalUrl, state.config.appConfig);
            if (finalCategory !== "keep") {
              if (finalCategory === "sponsored") stats.sponsored++;
              else if (finalCategory === "social") stats.social++;
              else if (finalCategory === "tracking") stats.tracking++;
              else if (finalCategory === "bonus") stats.bonus++;
              else if (finalCategory === "youtube") stats.youtube++;

              displayVerbose(
                `  ✗ Filtered after redirect (${finalCategory}): ${finalUrl}`
              );
              continue;
            }

            // 4. Check for duplicates (same base URL without query params)
            const baseUrl = finalUrl.split("?")[0];
            const originalBaseUrl = url.split("?")[0];

            if (seenUrls.has(baseUrl)) {
              displayVerbose(`  ⚠ Duplicate (skipping): ${finalUrl}`);
              continue;
            }

            // Track both original and resolved URLs to prevent duplicates
            seenUrls.add(baseUrl);
            seenUrls.add(originalBaseUrl);

            // 5. Fetch actual page title
            let title = extractTitleFromUrl(finalUrl); // Fallback
            try {
              const data = await extract(finalUrl);

              if (data?.title) {
                title = data.title;
              }
            } catch (error) {
              displayVerbose(
                `  ⚠ Failed to fetch title for ${finalUrl}, using fallback`
              );
            }

            articles.push({
              title,
              url: finalUrl,
              content: "",
            });

            stats.kept++;

            if (resolved.isNested) {
              displayVerbose(`  ✓ Resolved: ${url} → ${finalUrl}`);
            } else {
              displayVerbose(`  ✓ Kept: ${finalUrl}`);
            }
          } catch (error) {
            stats.errors++;
            displayVerbose(
              `  ✗ Error processing ${url}: ${
                error instanceof Error ? error.message : String(error)
              }`
            );
            // Skip problematic links rather than failing the entire process
          }
        }

        displayVerbose(`  → Kept ${articles.length}/${inputArticles.length} links`);

        return {
          ...newsletter,
          articles,
        };
      })
    )
  );

  // Add bonus and YouTube links as separate newsletters if they exist
  if (bonusLinks.length > 0) {
    enrichedNewsletters.push({
      id: `bonus-${Date.now()}`,
      pattern: {
        name: "Bonus Resources",
        from: "",
        subject: [],
        enabled: true,
      },
      date: new Date(),
      articles: bonusLinks,
    });
  }

  if (youtubeLinks.length > 0) {
    enrichedNewsletters.push({
      id: `youtube-${Date.now()}`,
      pattern: {
        name: "YouTube Content",
        from: "",
        subject: [],
        enabled: true,
      },
      date: new Date(),
      articles: youtubeLinks,
    });
  }

  // Display detailed stats
  const filtered = stats.sponsored + stats.social + stats.tracking;
  spinner.succeed(
    `Cleaned ${stats.total} links → kept ${stats.kept} articles | ` +
      `filtered: ${filtered} (sponsored: ${stats.sponsored}, social: ${stats.social}, tracking: ${stats.tracking}) | ` +
      `special: bonus: ${stats.bonus}, yt: ${stats.youtube} | errors: ${stats.errors}`
  );

  return {
    ...state,
    newsletters: enrichedNewsletters,
  };
};

/**
 * Strip UTM and tracking parameters from URL
 */
function stripTrackingParams(url: string): string {
  try {
    const urlObj = new URL(url);

    // List of tracking parameters to remove
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "ref",
      "affiliate",
      "aff",
      "source",
      "campaign",
      "fbclid",
      "gclid",
      "mc_cid",
      "mc_eid",
      "_hsenc",
      "_hsmi",
      "mkt_tok",
      "next", // bookshop.org tracking
      "r",
      "token", // substack tracking
    ];

    // Remove tracking params
    trackingParams.forEach((param) => {
      urlObj.searchParams.delete(param);
    });

    // Return clean URL
    let cleanUrl = urlObj.toString();

    // Remove trailing '?' if no params left
    if (cleanUrl.endsWith("?")) {
      cleanUrl = cleanUrl.slice(0, -1);
    }

    return cleanUrl;
  } catch {
    return url; // If parsing fails, return original
  }
}

/**
 * Check if a URL should be filtered out
 * Returns: 'keep' | 'sponsored' | 'social' | 'tracking' | 'bonus' | 'youtube'
 * @param url - The URL to categorize
 * @param appConfig - The app configuration containing newsletter patterns
 */
function categorizeLink(
  url: string,
  appConfig?: AppConfig
): "keep" | "sponsored" | "social" | "tracking" | "bonus" | "youtube" {
  try {
    const urlObj = new URL(url);
    const fullUrl = url.toLowerCase();
    const pathname = urlObj.pathname.toLowerCase();
    const search = urlObj.search.toLowerCase();
    const hostname = urlObj.hostname.toLowerCase();

    // 1. Tracking links (newsletter open/click tracking)
    if (
      pathname.includes("/open/") ||
      pathname.includes("/click/") ||
      pathname.includes("/track/")
    ) {
      return "tracking";
    }

    // API endpoints (reaction tracking, etc.)
    if (pathname.includes("/api/")) {
      return "tracking";
    }

    // Check if this URL is an intermediate domain (should be resolved, not filtered)
    if (appConfig) {
      const isIntermediateDomain = appConfig.newsletterPatterns.some(pattern => {
        const domains = pattern.nestedScraping?.intermediateDomains || [];
        return domains.some(domain => {
          const domainLower = domain.toLowerCase();
          // Handle wildcard patterns (e.g., *.daily.dev)
          if (domainLower.startsWith('*.')) {
            const baseDomain = domainLower.slice(2);
            return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
          }
          // Exact or subdomain match
          return hostname === domainLower || hostname.endsWith(`.${domainLower}`);
        });
      });

      // Skip social filtering for intermediate domains - they need resolution first
      if (isIntermediateDomain) {
        return "keep";
      }
    }

    // 2. Social media links and author profiles
    const socialDomains = [
      "twitter.com",
      "x.com",
      "mastodon.social",
      "linkedin.com",
      "facebook.com",
      "instagram.com",
      "threads.net",
      "reddit.com",
      "github.com", // Profile pages, not repos
    ];

    if (socialDomains.some((domain) => hostname.includes(domain))) {
      // Check if it's a GitHub profile vs repository
      if (hostname.includes("github.com")) {
        const pathParts = pathname.split("/").filter((p) => p);
        // Profile: github.com/username (1 part)
        // Repo: github.com/username/repo (2+ parts)
        if (pathParts.length === 1) {
          return "social";
        }
        // Otherwise keep it (it's a repo)
      } else {
        return "social";
      }
    }

    // Substack author profiles (e.g., substack.com/@username)
    if (hostname.includes("substack.com") && pathname.startsWith("/@")) {
      return "social";
    }

    // Substack homepage without specific post
    if (hostname.includes(".substack.com")) {
      const pathParts = pathname.split("/").filter((p) => p);
      // Homepage: domain.substack.com/ (0 parts)
      // Post: domain.substack.com/p/post-slug (2+ parts)
      if (
        pathParts.length === 0 ||
        (pathParts.length === 1 && pathParts[0] === "")
      ) {
        return "social"; // Homepage, not a specific post
      }
    }

    // 3. YouTube content (mark for special handling)
    if (hostname.includes("youtube.com") || hostname.includes("youtu.be")) {
      return "youtube";
    }

    // 4. Bonus resources (PDFs, ebooks, downloadable content)
    const bonusExtensions = [".pdf", ".epub", ".mobi", ".zip", ".ebook"];
    if (bonusExtensions.some((ext) => pathname.endsWith(ext))) {
      return "bonus";
    }

    // Also check for ebook/whitepaper/guide paths
    const bonusKeywords = [
      "/ebook",
      "/whitepaper",
      "/guide",
      "/download",
      "/almanac",
      "/report",
    ];
    if (bonusKeywords.some((keyword) => pathname.includes(keyword))) {
      // Additional check: if it's a direct resource (not a landing page)
      if (
        pathname.endsWith(".pdf") ||
        pathname.includes("/ebooks/") ||
        pathname.includes("/almanac/")
      ) {
        return "bonus";
      }
    }

    // 5. Sponsored content (courses, promotional content, affiliate links)
    const sponsoredDomains = [
      "frontendmasters.com",
      "udemy.com",
      "coursera.org",
      "pluralsight.com",
      "egghead.io",
      "levelup.video",
      "bookshop.org", // Affiliate book links
    ];

    if (sponsoredDomains.some((domain) => hostname.includes(domain))) {
      // Bookshop.org is always affiliate, filter it
      if (hostname.includes("bookshop.org")) {
        return "sponsored";
      }

      // For course platforms, check if it's course content (not blog/resources)
      if (
        pathname.includes("/courses/") ||
        pathname.includes("/learn/") ||
        pathname.includes("/course/")
      ) {
        return "sponsored";
      }
    }

    // Sponsored query params (ref links, affiliate links)
    const sponsoredParams = [
      "ref=",
      "utm_source=email",
      "utm_medium=",
      "affiliate",
      "aff=",
    ];
    if (sponsoredParams.some((param) => search.includes(param))) {
      // If has ref= or utm_source=email with utm_medium, likely sponsored
      if (
        search.includes("ref=") ||
        (search.includes("utm_source=email") && search.includes("utm_medium="))
      ) {
        return "sponsored";
      }
    }

    // 6. Marketing/promotional links
    const marketingDomains = [
      "unsubscribe",
      "preferences",
      "manage-subscription",
      "email-settings",
    ];

    if (marketingDomains.some((domain) => hostname.includes(domain))) {
      return "sponsored";
    }

    const marketingPaths = [
      "/sale",
      "/deals",
      "/discount",
      "/promo",
      "/pricing",
      "/buy",
      "/purchase",
      "/subscribe",
      "/unsubscribe",
      "/preferences",
      "/email-preferences",
      "/manage",
      "/optin",
      "/optout",
      "/signup",
      "/register",
      "/account",
      "/comments", // Comment sections
      "/action/", // Substack actions (unsubscribe, etc.)
      "/s/", // Substack section links (e.g., /s/maker-labs)
    ];

    if (marketingPaths.some((path) => pathname.includes(path))) {
      return "sponsored";
    }

    // Substack app links
    if (hostname === "substack.com" && pathname === "/app") {
      return "sponsored";
    }

    // Check for sale/promo in query params
    if (
      search.includes("sale") ||
      search.includes("promo") ||
      search.includes("discount") ||
      search.includes("coupon")
    ) {
      return "sponsored";
    }

    // If none of the above, keep it
    return "keep";
  } catch {
    return "keep"; // If URL parsing fails, keep it to be safe
  }
}

/**
 * Legacy function for backwards compatibility
 */
function isMarketingLink(url: string): boolean {
  const category = categorizeLink(url);
  return (
    category === "sponsored" || category === "tracking" || category === "social"
  );
}

/**
 * Filter blacklisted URLs from articles
 * Universal function that works throughout the pipeline
 */
const filterBlacklistedUrls = (
  state: CollectedNewsletters
): CollectedNewsletters => {
  const blacklistedUrls = state.contentFilters.blacklistedUrls || [];

  if (blacklistedUrls.length === 0) {
    return state;
  }

  const spinner = displayProgress("Filtering blacklisted URLs...");
  let totalFiltered = 0;

  const filteredNewsletters = state.newsletters.map((newsletter) => {
    const beforeCount = newsletter.articles.length;

    const filteredArticles = newsletter.articles.filter((article) => {
      const isBlacklisted = checkBlacklist(article.url, blacklistedUrls);
      if (isBlacklisted) {
        displayVerbose(`  ⊗ Filtered blacklisted: ${article.url}`);
        totalFiltered++;
      }
      return !isBlacklisted;
    });

    const filteredCount = beforeCount - filteredArticles.length;
    if (filteredCount > 0) {
      displayVerbose(
        `  → Filtered ${filteredCount} blacklisted URLs from ${newsletter.pattern.name}`
      );
    }

    return {
      ...newsletter,
      articles: filteredArticles,
    };
  });

  spinner.succeed(`Filtered ${totalFiltered} blacklisted URLs`);

  return {
    ...state,
    newsletters: filteredNewsletters,
  };
};

/**
 * Check if URL matches blacklist patterns
 */
function checkBlacklist(url: string, blacklistedUrls: string[]): boolean {
  try {
    const urlObj = new URL(url);

    return blacklistedUrls.some((pattern) => {
      // Exact match
      if (pattern === url) {
        return true;
      }

      // Pattern with wildcard domain (e.g., *.example.com)
      if (pattern.startsWith("*.")) {
        const domain = pattern.slice(2).toLowerCase();
        const hostname = urlObj.hostname.toLowerCase();
        return hostname === domain || hostname.endsWith(`.${domain}`);
      }

      // Pattern with path wildcard (e.g., https://example.com/premium/*)
      if (pattern.endsWith("/*")) {
        const basePattern = pattern.slice(0, -2);
        return url.startsWith(basePattern);
      }

      return false;
    });
  } catch (error) {
    // Invalid URL, skip filtering
    return false;
  }
}

/**
 * Save collected newsletters to LINKS.yaml
 */
const saveToYaml = async (
  state: CollectedNewsletters
): Promise<CollectedNewsletters> => {
  // Save to LINKS.yaml
  await saveLinksToYaml(state.newsletters, "LINKS.yaml");

  // Calculate totals
  const totalLinks = state.newsletters.reduce(
    (sum, n) => sum + n.articles.length,
    0
  );

  displaySuccess(
    `\nSuccessfully saved ${totalLinks} links from ${state.newsletters.length} newsletters to LINKS.yaml`
  );
  displayInfo("\nNext steps:");
  displayInfo("  1. Review and edit LINKS.yaml to customize the links");
  displayInfo(
    '  2. Run "npm run generate" to process the links and generate summaries'
  );
  displayInfo("\nNote: Emails have NOT been marked as read or deleted yet.");
  displayInfo('      This will happen when you run "npm run generate".');

  return state;
};

/**
 * Extract a readable title from URL
 * Falls back to domain name if path is not meaningful
 */
function extractTitleFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // Remove leading/trailing slashes
    const cleanPath = pathname.replace(/^\/+|\/+$/g, "");

    if (!cleanPath) {
      // No path, use domain
      return urlObj.hostname;
    }

    // Get last segment of path
    const segments = cleanPath.split("/");
    const lastSegment = segments[segments.length - 1];

    // Remove file extension if present
    const withoutExt = lastSegment.replace(/\.[^.]+$/, "");

    // Convert hyphens/underscores to spaces and capitalize
    const title = withoutExt
      .replace(/[-_]/g, " ")
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    return title || urlObj.hostname;
  } catch {
    // If URL parsing fails, return the URL as-is
    return url;
  }
}

/**
 * Prepare Pipeline - Collect newsletters and save to LINKS.yaml
 * Does NOT scrape content or call LLM
 * Does NOT mark emails as processed
 */
export const preparePipe = async (state: PatternsState): Promise<void> => {
  await pipeAsync(
    searchAndCollectNewsletters,
    exitIfNoNewsletters,
    convertUrlsToArticles,      // Convert URLs to articles early
    filterBlacklistedUrls,       // Filter blacklisted URLs (pre-enrichment)
    cleanAndEnrichLinks,         // Enrich articles (resolve redirects, fetch titles, etc.)
    filterBlacklistedUrls,       // Filter blacklisted URLs again (post-enrichment)
    saveToYaml
  )(state);
};
