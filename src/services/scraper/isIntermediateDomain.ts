/**
 * Checks if a URL matches intermediate domain patterns
 * Used to identify URLs that need nested resolution
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
      // Check exact match or subdomain match
      return hostname === domainLower ||
             hostname.endsWith(`.${domainLower}`);
    });
  } catch (error) {
    // Invalid URL
    return false;
  }
};