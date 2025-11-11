/**
 * Checks if a URL matches intermediate domain patterns
 * Used to identify URLs that need nested resolution
 * Supports wildcard patterns like *.daily.dev
 */
export const isIntermediateDomain = (
  url: string,
  intermediateDomains: string[]
): boolean => {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return intermediateDomains.some(domain => {
      const domainLower = domain.toLowerCase();

      // Handle wildcard patterns (e.g., *.daily.dev)
      if (domainLower.startsWith('*.')) {
        const baseDomain = domainLower.slice(2); // Remove "*."
        // Match any subdomain of baseDomain
        return hostname === baseDomain || hostname.endsWith(`.${baseDomain}`);
      }

      // Check exact match or subdomain match for non-wildcard patterns
      return hostname === domainLower ||
             hostname.endsWith(`.${domainLower}`);
    });
  } catch (error) {
    // Invalid URL
    return false;
  }
};