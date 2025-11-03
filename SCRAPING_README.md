# Newsletter Scraping Documentation

## Overview

This document details the advanced scraping capabilities of the Newsletter AI system, with a focus on the **nested scraping** feature designed to handle newsletters that link to intermediate pages before reaching the actual article content.

## Table of Contents
- [Architecture](#architecture)
- [Nested Scraping Feature](#nested-scraping-feature)
- [Resolution Strategies](#resolution-strategies)
- [Configuration Guide](#configuration-guide)
- [Implementation Details](#implementation-details)
- [Performance Considerations](#performance-considerations)
- [Troubleshooting](#troubleshooting)

## Architecture

The scraping system follows a functional programming architecture with pure functions and composable pipeline steps:

```
Newsletter Email → URL Extraction → URL Resolution → Content Scraping → Validation → Output
                                    ↑
                                    Nested Scraping (if configured)
```

### Key Components

- **scrapeArticle.ts** - Core scraping function with nested resolution support
- **resolveUrl.ts** - URL resolution orchestrator with multiple strategies
- **followRedirect.ts** - HTTP redirect following implementation
- **extractUrlFromMeta.ts** - Meta tag and DOM extraction utilities
- **isIntermediateDomain.ts** - Domain pattern matching for intermediate pages

## Nested Scraping Feature

### Problem Statement

Some newsletters (notably daily.dev) link to intermediate pages that redirect or link to the actual article. For example:

```
Email links to → https://app.daily.dev/posts/GFdepEH63
Which redirects to → https://api.daily.dev/r/GFdepEH63
Which redirects to → https://medium.com/actual-article
```

### Solution

The nested scraping feature automatically detects and resolves these intermediate URLs using configurable strategies before scraping the actual content.

## Resolution Strategies

### 1. "redirect" Strategy - HTTP Redirect Following

**How it works:**
- Makes HTTP HEAD requests to follow 301/302/303/307/308 redirects
- Tracks the entire redirect chain
- Handles relative URLs and circular redirects

**Implementation:**
```javascript
// Uses HEAD requests for efficiency
const response = await fetch(url, {
  method: 'HEAD',
  redirect: 'manual', // Don't follow automatically
});

// Check Location header for redirect
if (response.status >= 300 && response.status < 400) {
  const location = response.headers.get('location');
  // Follow to next URL...
}
```

**Best for:**
- URL shorteners (bit.ly, tinyurl)
- Analytics tracking URLs
- Server-side redirects (daily.dev pattern)

**Configuration:**
```json
{
  "nestedScraping": {
    "enabled": true,
    "strategy": "redirect",
    "intermediateDomains": ["app.daily.dev", "api.daily.dev"]
  }
}
```

### 2. "meta-tags" Strategy - HTML Meta Tag Extraction

**How it works:**
- Fetches intermediate page HTML
- Parses meta tags in priority order:
  1. `og:url` - Open Graph URL
  2. `canonical` - Canonical link
  3. `article:url` - Article specific URL
  4. `twitter:url` - Twitter card URL

**Implementation:**
```javascript
const $ = cheerio.load(html);

// Check meta tags in priority order
const ogUrl = $('meta[property="og:url"]').attr('content');
const canonical = $('link[rel="canonical"]').attr('href');
// ... etc
```

**Best for:**
- Blog aggregators
- Content platforms
- Social sharing preview pages

**Configuration:**
```json
{
  "nestedScraping": {
    "enabled": true,
    "strategy": "meta-tags",
    "intermediateDomains": ["medium-aggregator.com"]
  }
}
```

### 3. "dom-selector" Strategy - Custom DOM Selection

**How it works:**
- Uses CSS selectors to find the actual article link
- Supports complex selector patterns
- Extracts href, data attributes, or text content

**Implementation:**
```javascript
const $ = cheerio.load(html);
const element = $(selector).first();

// Try multiple extraction methods
const url = element.attr('href') ||
            element.attr('data-url') ||
            element.text(); // If text is a URL
```

**Best for:**
- Proprietary newsletter platforms
- Custom intermediate pages
- When specific link patterns need targeting

**Configuration:**
```json
{
  "nestedScraping": {
    "enabled": true,
    "strategy": "dom-selector",
    "selector": "a.article-link[data-type='external']",
    "intermediateDomains": ["custom-platform.com"]
  }
}
```

### 4. "auto" Strategy - Intelligent Multi-Strategy

**How it works:**
1. Tries HTTP redirect following first
2. Falls back to meta tag extraction if no redirects
3. Optionally tries DOM selector if configured
4. Returns original URL if all strategies fail

**Decision Flow:**
```
Start → Try Redirects → Found? → Return
         ↓ Not Found
        Try Meta Tags → Found? → Return
         ↓ Not Found
        Try Selector → Found? → Return
         ↓ Not Found
        Return Original URL
```

**Best for:**
- Unknown newsletter types
- Maximum compatibility
- Default configuration

**Configuration:**
```json
{
  "nestedScraping": {
    "enabled": true,
    "strategy": "auto",
    "intermediateDomains": ["newsletter.site"],
    "selector": "a.external-link" // Optional fallback
  }
}
```

## Configuration Guide

### Newsletter Pattern Configuration

Add nested scraping to specific newsletters in `config.json`:

```json
{
  "newsletterPatterns": [
    {
      "name": "daily.dev",
      "from": "informer@daily.dev",
      "subject": ["Daily Digest"],
      "enabled": true,
      "maxArticles": 20,
      "nestedScraping": {
        "enabled": true,
        "intermediateDomains": ["app.daily.dev", "api.daily.dev"],
        "strategy": "auto",
        "maxDepth": 1,
        "selector": null
      }
    }
  ]
}
```

### Global Scraper Options

Configure global nested scraping settings:

```json
{
  "scraperOptions": {
    "timeout": 30000,
    "userAgent": "Mozilla/5.0 (compatible; NewsletterBot/1.0)",
    "retryAttempts": 3,
    "nestedScraping": {
      "followRedirects": true,
      "maxRedirects": 5,
      "timeout": 15000
    }
  }
}
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | false | Enable nested scraping for this pattern |
| `intermediateDomains` | string[] | [] | List of domains to trigger resolution |
| `strategy` | string | "auto" | Resolution strategy to use |
| `selector` | string | null | CSS selector for dom-selector strategy |
| `maxDepth` | number | 1 | Maximum resolution depth |
| `followRedirects` | boolean | true | Global: Allow redirect following |
| `maxRedirects` | number | 5 | Global: Maximum redirects to follow |
| `timeout` | number | 15000 | Global: Timeout for resolution requests |

## Implementation Details

### URL Resolution Flow

1. **Domain Check**: URL is checked against `intermediateDomains`
2. **Strategy Selection**: Appropriate strategy is executed
3. **Resolution**: URL is resolved to final destination
4. **Caching**: Result is cached for session
5. **Scraping**: Final URL is scraped for content

### Caching Mechanism

The system implements an in-memory cache for resolved URLs:

```javascript
const resolvedUrlCache = new Map<string, ResolvedUrl>();

// Cache key includes strategy and selector
const cacheKey = `${url}:${strategy}:${selector || ''}`;
```

Benefits:
- Avoids redundant resolutions
- Improves performance for duplicate URLs
- Automatically limits size (FIFO eviction)

### Error Handling

The system gracefully handles various error scenarios:

1. **Network Errors**: Falls back to original URL
2. **Timeouts**: Configurable timeout with fallback
3. **Circular Redirects**: Detection and prevention
4. **Invalid URLs**: Validation before processing
5. **Missing Content**: Returns original URL

### Verbose Logging

Enable verbose mode for detailed resolution information:

```bash
VERBOSE=true npm run process
```

Example output:
```
⚡ Nested scraping detected for: https://app.daily.dev/posts/abc123
  → Checking redirect for: https://app.daily.dev/posts/abc123
  ↳ Redirected to: https://api.daily.dev/r/abc123 (302)
  ↳ Redirected to: https://medium.com/article (302)
  ✓ Final URL reached: https://medium.com/article
✓ Resolved to final URL: https://medium.com/article
```

## Performance Considerations

### Optimization Strategies

1. **HEAD vs GET**: Uses HEAD requests for redirect checking (90% faster)
2. **Concurrent Processing**: Multiple URLs resolved in parallel
3. **Early Termination**: Stops at first successful resolution
4. **Smart Caching**: Remembers resolutions within session
5. **Selective Fetching**: Only fetches HTML when necessary

### Performance Metrics

| Operation | Typical Time | With Caching |
|-----------|--------------|--------------|
| Redirect Following | 200-500ms | 0ms |
| Meta Tag Extraction | 500-1000ms | 0ms |
| DOM Selection | 500-1000ms | 0ms |
| Auto Strategy | 200-1500ms | 0ms |

### Concurrency Settings

```javascript
// Maximum concurrent scraping operations
const maxConcurrent = 3;

// Each operation can resolve nested URLs independently
// Total concurrent requests = maxConcurrent * resolution requests
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Redirects Not Following

**Issue**: URLs not resolving despite redirects
**Solution**: Check if `followRedirects` is enabled in global config

```json
{
  "scraperOptions": {
    "nestedScraping": {
      "followRedirects": true
    }
  }
}
```

#### 2. Domain Not Matching

**Issue**: Nested scraping not triggering
**Solution**: Verify domain patterns include all variations

```json
{
  "intermediateDomains": [
    "app.daily.dev",
    "api.daily.dev",
    "daily.dev"  // Include base domain if needed
  ]
}
```

#### 3. Timeout Errors

**Issue**: Resolution timing out
**Solution**: Increase timeout in global settings

```json
{
  "scraperOptions": {
    "nestedScraping": {
      "timeout": 30000  // Increase to 30 seconds
    }
  }
}
```

#### 4. Circular Redirects

**Issue**: Infinite redirect loop detected
**Solution**: System automatically breaks loops, check logs for redirect chain

#### 5. Wrong Content Scraped

**Issue**: Intermediate page content scraped instead of article
**Solution**: Verify strategy and selectors are correct

### Debug Commands

```bash
# Test with verbose output
VERBOSE=true npm run process

# Test specific newsletter with dry-run
npm run process -- --dry-run --pattern "daily.dev"

# Test with specific strategy
# Edit config.json to set strategy, then:
npm run process -- --dry-run
```

### Testing Nested Scraping

1. **Dry Run Mode**: Test without marking emails as read
   ```bash
   npm run process -- --dry-run
   ```

2. **Single Newsletter**: Test specific pattern
   ```bash
   npm run process -- --pattern "daily.dev" --dry-run
   ```

3. **Verbose Logging**: See detailed resolution steps
   ```bash
   VERBOSE=true npm run process -- --dry-run
   ```

## Examples

### Example 1: Daily.dev Configuration

```json
{
  "name": "daily.dev",
  "nestedScraping": {
    "enabled": true,
    "intermediateDomains": ["app.daily.dev", "api.daily.dev"],
    "strategy": "redirect",
    "maxDepth": 2
  }
}
```

Resolution flow:
1. Email link: `https://app.daily.dev/posts/abc123`
2. Redirect to: `https://api.daily.dev/r/abc123`
3. Redirect to: `https://medium.com/actual-article`
4. Scrape: Final article content

### Example 2: Medium Aggregator

```json
{
  "name": "Medium Weekly",
  "nestedScraping": {
    "enabled": true,
    "intermediateDomains": ["medium-weekly.com"],
    "strategy": "meta-tags"
  }
}
```

Resolution flow:
1. Email link: `https://medium-weekly.com/preview/12345`
2. Extract `og:url`: `https://medium.com/@author/article`
3. Scrape: Article content

### Example 3: Custom Platform

```json
{
  "name": "Tech Newsletter",
  "nestedScraping": {
    "enabled": true,
    "intermediateDomains": ["technews.platform"],
    "strategy": "dom-selector",
    "selector": "div.article-preview a.read-more[target='_blank']"
  }
}
```

Resolution flow:
1. Email link: `https://technews.platform/preview/789`
2. Find element: `<a class="read-more" target="_blank" href="...">`
3. Extract href: `https://originalblog.com/article`
4. Scrape: Article content

## Future Enhancements

Potential improvements for the nested scraping system:

1. **Machine Learning**: Auto-detect intermediate pages without configuration
2. **Pattern Learning**: Remember successful patterns per domain
3. **JavaScript Rendering**: Support for SPA intermediate pages
4. **API Integration**: Direct API calls for known platforms
5. **Parallel Strategies**: Try multiple strategies simultaneously
6. **Smart Caching**: Persist cache between sessions
7. **Analytics**: Track resolution success rates per strategy

## Contributing

To add support for a new newsletter with intermediate pages:

1. Identify the intermediate domain pattern
2. Test which resolution strategy works best
3. Add configuration to `config.json`
4. Test with `--dry-run` flag
5. Submit PR with configuration and test results

## Support

For issues or questions about nested scraping:

1. Enable verbose mode for debugging
2. Check this documentation
3. Review logs for error messages
4. Open an issue with configuration and logs