# Newsletter Scraping

Details on the advanced scraping capabilities, with a focus on the **nested scraping** feature for newsletters that link to intermediate pages before reaching the actual article content.

## Architecture

The scraping system follows a functional programming architecture with pure functions and composable pipeline steps:

```
Newsletter Email → URL Extraction → URL Resolution → Content Scraping → Validation → Output
                                    ↑
                                    Nested Scraping (if configured)
```

### Key Components

- **scrapeArticle.ts** — Core scraping function with nested resolution support
- **resolveUrl.ts** — URL resolution orchestrator with multiple strategies
- **followRedirect.ts** — HTTP redirect following implementation
- **extractUrlFromMeta.ts** — Meta tag and DOM extraction utilities
- **isIntermediateDomain.ts** — Domain pattern matching for intermediate pages

## Nested Scraping

Some newsletters (notably daily.dev) link to intermediate pages that redirect or link to the actual article:

```
Email links to → https://app.daily.dev/posts/GFdepEH63
Which redirects to → https://api.daily.dev/r/GFdepEH63
Which redirects to → https://medium.com/actual-article
```

The nested scraping feature automatically detects and resolves these intermediate URLs using configurable strategies before scraping the actual content.

## Resolution Strategies

### "redirect" — HTTP Redirect Following

Makes HTTP HEAD requests to follow 301/302/303/307/308 redirects. Tracks the entire redirect chain, handles relative URLs and circular redirects.

Best for: URL shorteners, analytics tracking URLs, server-side redirects (daily.dev pattern).

### "meta-tags" — HTML Meta Tag Extraction

Fetches intermediate page HTML and parses meta tags in priority order: `og:url`, `canonical`, `article:url`, `twitter:url`.

Best for: Blog aggregators, content platforms, social sharing preview pages.

### "dom-selector" — Custom DOM Selection

Uses CSS selectors to find the actual article link. Supports complex selector patterns and extracts href, data attributes, or text content.

Best for: Proprietary newsletter platforms, custom intermediate pages.

### "auto" — Intelligent Multi-Strategy

1. Tries HTTP redirect following first
2. Falls back to meta tag extraction if no redirects
3. Optionally tries DOM selector if configured
4. Returns original URL if all strategies fail

Best for: Unknown newsletter types, maximum compatibility. This is the recommended default.

## Configuration

Add `nestedScraping` to a newsletter pattern in `config.yaml`:

```yaml
newsletterPatterns:
  - name: "daily.dev"
    from: "informer@daily.dev"
    enabled: true
    maxArticles: 20
    nestedScraping:
      enabled: true
      intermediateDomains: ["app.daily.dev", "api.daily.dev"]
      strategy: "auto"
      maxDepth: 2
      selector: null  # Optional: CSS selector for dom-selector strategy
```

### Configuration Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `enabled` | boolean | false | Enable nested scraping for this pattern |
| `intermediateDomains` | string[] | [] | Domains that trigger resolution |
| `strategy` | string | "auto" | Resolution strategy |
| `selector` | string | null | CSS selector for dom-selector strategy |
| `maxDepth` | number | 1 | Maximum resolution depth |

## Implementation Details

### URL Resolution Flow

1. **Domain Check** — URL is checked against `intermediateDomains`
2. **Strategy Selection** — Appropriate strategy is executed
3. **Resolution** — URL is resolved to final destination
4. **Caching** — Result is cached for the session
5. **Scraping** — Final URL is scraped for content

### Caching

An in-memory cache avoids redundant resolutions within a session. Cache key includes strategy and selector, so different configurations don't collide.

### Error Handling

The system gracefully falls back to the original URL on network errors, timeouts, circular redirects, invalid URLs, or missing content.

## Performance

- Uses HEAD requests for redirect checking (much faster than GET)
- Resolves multiple URLs concurrently
- Early termination at first successful resolution
- Session-level caching eliminates repeated work

| Operation | Typical Time | With Cache |
|-----------|--------------|------------|
| Redirect Following | 200–500ms | 0ms |
| Meta Tag Extraction | 500–1000ms | 0ms |
| DOM Selection | 500–1000ms | 0ms |
| Auto Strategy | 200–1500ms | 0ms |

## Troubleshooting

**Nested scraping not triggering:** Verify `intermediateDomains` includes all domain variations (e.g., both `app.daily.dev` and `api.daily.dev`).

**Timeout errors:** The default timeout is 15 seconds. If resolution is slow, check network access to the intermediate domain.

**Circular redirects:** Automatically detected and broken. Check logs for the redirect chain to identify the loop.

**Wrong content scraped:** The intermediate page itself got scraped instead of the article. Verify your strategy and `intermediateDomains` pattern matches the actual intermediate URL.
