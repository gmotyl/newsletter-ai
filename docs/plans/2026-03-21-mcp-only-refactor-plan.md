# MCP-Only Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform newsletter-ai from a CLI+LLM+MCP hybrid into an MCP-only library with a Settings UI for newsletter management.

**Architecture:** Strip LLM service, processor, CLI, and generate pipeline. Keep MCP server, IMAP, scraper, config, and utils. Add Astro+Refine+Mantine Settings UI with Fastify API backend. Improve motyl-dev onboarding with interactive init:mcp script.

**Tech Stack:** TypeScript, MCP SDK, IMAP, @extractus/article-extractor, Astro, React, Refine, Mantine, Fastify

---

## Phase 1 — MCP-Only Refactor

### Task 1: Remove LLM Service

**Files:**
- Delete: `src/services/llm/` (entire directory, 20 modules)
- Modify: `src/types/index.ts` — remove `LLMConfig`, `Summary`, `ArticleSummary` types

**Step 1: Identify LLM type usages**

Run: `grep -r "LLMConfig\|Summary\|ArticleSummary" src/ --include="*.ts" -l`

Check which files outside `src/services/llm/` reference these types. Only remove types that are no longer referenced after all Phase 1 deletions.

**Step 2: Delete the LLM service directory**

```bash
rm -rf src/services/llm/
```

**Step 3: Run build to identify broken imports**

Run: `pnpm build 2>&1 | head -50`
Expected: Errors in files that imported from `src/services/llm/`

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: remove LLM service (20 modules)"
```

---

### Task 2: Remove Processor Service

**Files:**
- Delete: `src/services/processor/` (entire directory, 19 modules)

**Step 1: Delete the processor service directory**

```bash
rm -rf src/services/processor/
```

**Step 2: Run build to find broken imports**

Run: `pnpm build 2>&1 | head -50`

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: remove processor service (19 modules)"
```

---

### Task 3: Remove CLI Module

**Files:**
- Delete: `src/cli/` (entire directory, 35+ files)

**Step 1: Delete the CLI directory**

```bash
rm -rf src/cli/
```

**Step 2: Run build to find broken imports**

Run: `pnpm build 2>&1 | head -50`

**Step 3: Commit**

```bash
git add -A && git commit -m "refactor: remove CLI module (35+ files)"
```

---

### Task 4: Remove Generate Pipeline & Dependent Newsletter Modules

**Files:**
- Delete: `src/newsletter/generatePipeline.ts`
- Delete: `src/newsletter/processNewsletters.ts` (uses processor service)
- Delete: `src/newsletter/saveSummaries.ts` (saves LLM output)
- Delete: `src/newsletter/pipeline.ts` (default pipeline composing prepare+generate)
- Delete: `src/newsletter/confirmProcessing.ts` (CLI interactive — uses inquirer)
- Delete: `src/newsletter/displayCompletion.ts` (CLI display — uses chalk)
- Delete: `src/newsletter/createProgressCallback.ts` (CLI progress — uses ora)
- Delete: `src/newsletter/exitIfNoNewsletters.ts` (CLI exit)
- Keep: `src/newsletter/preparePipeline.ts` (IMAP fetch + link extraction)
- Keep: `src/newsletter/searchAndCollectNewsletters.ts` (IMAP search)
- Keep: `src/newsletter/markAsProcessed.ts` (IMAP mark read/delete)
- Keep: `src/newsletter/types.ts`
- Modify: `src/newsletter/index.ts` — update barrel exports

**Step 1: Delete files that depend on removed services**

```bash
rm src/newsletter/generatePipeline.ts
rm src/newsletter/processNewsletters.ts
rm src/newsletter/saveSummaries.ts
rm src/newsletter/pipeline.ts
rm src/newsletter/confirmProcessing.ts
rm src/newsletter/displayCompletion.ts
rm src/newsletter/createProgressCallback.ts
rm src/newsletter/exitIfNoNewsletters.ts
```

**Step 2: Update barrel export**

Edit `src/newsletter/index.ts`:
```typescript
export { preparePipe } from "./preparePipeline.js";
export { searchAndCollectNewsletters } from "./searchAndCollectNewsletters.js";
export { markAsProcessed } from "./markAsProcessed.js";
export type { CollectedNewsletters, ProcessedNewsletters } from "./types.js";
```

**Step 3: Run build**

Run: `pnpm build 2>&1 | head -50`

**Step 4: Commit**

```bash
git add -A && git commit -m "refactor: remove generate pipeline and CLI-dependent newsletter modules"
```

---

### Task 5: Simplify Entry Point

**Files:**
- Modify: `src/index.ts` — replace CLI routing with MCP-only start

**Step 1: Rewrite src/index.ts**

```typescript
import { startMCPServer } from "./mcp/server.js";

startMCPServer().catch((error) => {
  console.error("Failed to start MCP server:", error);
  process.exit(1);
});
```

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -50`
Expected: Clean build (or remaining import errors to fix)

**Step 3: Commit**

```bash
git add src/index.ts && git commit -m "refactor: simplify entry point to MCP-only"
```

---

### Task 6: Clean Up Config — Remove LLM References

**Files:**
- Modify: `src/config/config.ts` — remove `getLLMConfig()`, `getVerboseMode()`, `getInteractiveMode()` and any LLM env var loading
- Modify: `src/config/pipeline/` — remove `ConfiguredState`, `PatternsState` if they reference LLM config
- Modify: `.env.example` — remove LLM_PROVIDER, LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS, LLM_API_KEY lines

**Step 1: Read config.ts and identify LLM-specific exports**

Read `src/config/config.ts` and remove:
- `getLLMConfig()` function
- Any references to `LLM_PROVIDER`, `LLM_MODEL`, `LLM_TEMPERATURE`, `LLM_MAX_TOKENS`
- `getVerboseMode()`, `getInteractiveMode()` if only used by CLI

Keep:
- `getEmailCredentials()`, `getProcessingOptions()`, `getOutputPath()`, `getOutputLanguage()`, `getNarratorPersona()`, `getProjectRoot()`, `getAppConfig()`

**Step 2: Clean up config pipeline types**

Remove any pipeline state types that reference LLM config (`ConfiguredState.finalLLMConfig`, etc.)

**Step 3: Update .env.example**

Remove LLM lines, keep IMAP + processing + output lines.

**Step 4: Run build**

Run: `pnpm build 2>&1 | head -50`

**Step 5: Commit**

```bash
git add -A && git commit -m "refactor: remove LLM references from config"
```

---

### Task 7: Clean Up Types

**Files:**
- Modify: `src/types/index.ts` — remove unused types

**Step 1: Remove types only used by deleted modules**

Remove: `LLMConfig`, `Summary`, `ArticleSummary`, and any other types only referenced by LLM/processor/CLI code.

Keep: `EmailCredentials`, `NewsletterPattern`, `Article`, `Newsletter`, `EmailMetadata`, `EmailContent`, `Result`, `ResolvedUrl`, `ContentFilters`, `ScraperOptions`, `ProcessingOptions`, `AppConfig`

**Step 2: Run build**

Run: `pnpm build 2>&1 | head -50`
Expected: Clean build

**Step 3: Commit**

```bash
git add src/types/index.ts && git commit -m "refactor: remove unused LLM/CLI types"
```

---

### Task 8: Remove Unused Dependencies

**Files:**
- Modify: `package.json` — remove deps and scripts

**Step 1: Remove dependencies**

Remove from `dependencies`:
```
ai, @ai-sdk/anthropic, @ai-sdk/openai, chalk, inquirer, ora, puppeteer
```

Check if `cheerio` is used by scraper (likely yes via article-extractor) — keep if so.
Check if `lodash`/`lodash-es` are used outside deleted code — keep if so.

**Step 2: Remove scripts**

Remove from `scripts`:
```
prepare, generate, dev, start, process, process:dev, dry-run, process:daily
```

Update remaining scripts:
```json
{
  "start": "tsx src/index.ts",
  "run:mcp": "tsx src/mcp/index.ts",
  "build": "tsc",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "init:claude": "node scripts/init-claude.js"
}
```

**Step 3: Run pnpm install to clean lockfile**

```bash
pnpm install
```

**Step 4: Run build + tests**

```bash
pnpm build && pnpm test
```

**Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml && git commit -m "refactor: remove unused dependencies and scripts"
```

---

### Task 9: Fix and Update Tests

**Files:**
- Delete: tests for removed modules (LLM, processor, CLI, generate pipeline)
- Keep: tests for IMAP, scraper, MCP tools, prepare pipeline
- Modify: any remaining tests with broken imports

**Step 1: Identify test files to remove**

```bash
find tests/ -name "*.test.ts" -exec grep -l "llm\|processor\|cli\|generate" {} \;
```

Also check `tests/integration/generate-flow.test.ts` — delete it.

**Step 2: Delete irrelevant test files**

**Step 3: Fix remaining tests**

Run: `pnpm test 2>&1 | tail -30`

Fix any import errors in remaining tests.

**Step 4: Run full test suite**

Run: `pnpm test`
Expected: All remaining tests pass

**Step 5: Commit**

```bash
git add -A && git commit -m "test: remove obsolete tests, fix remaining test imports"
```

---

### Task 10: Update README and Documentation

**Files:**
- Modify: `README.md` — rewrite as MCP-only tool
- Delete: `SCRAPING_README.md` (if only relevant to CLI scraping workflow)
- Keep: `PROMPT.md`, `LINKS_PROMPT.md` (still used by MCP tools)

**Step 1: Rewrite README.md**

Position as: "MCP server for Claude Code that connects to your email, fetches newsletters, scrapes article content, and provides it to Claude for summarization."

Sections:
- What it does
- Quick start (clone, install, configure .env, add to .mcp.json)
- MCP tools reference (10 tools)
- Configuration (config.yaml patterns)
- Settings UI (coming in Phase 3)

**Step 2: Clean up or remove SCRAPING_README.md**

If scraping docs are still relevant (article-extractor usage), keep but simplify. Otherwise delete.

**Step 3: Commit**

```bash
git add -A && git commit -m "docs: update README for MCP-only architecture"
```

---

### Task 11: Final Validation

**Step 1: Clean build**

```bash
rm -rf dist/ && pnpm build
```
Expected: Clean build, no errors

**Step 2: Run tests**

```bash
pnpm test
```
Expected: All tests pass

**Step 3: Test MCP server starts**

```bash
timeout 5 pnpm run:mcp || true
```
Expected: Server starts without errors (will timeout since it waits for stdio)

**Step 4: Verify no dead imports**

```bash
grep -r "from.*llm" src/ --include="*.ts"
grep -r "from.*processor" src/ --include="*.ts"
grep -r "from.*cli" src/ --include="*.ts"
```
Expected: No matches

**Step 5: Commit any remaining fixes**

```bash
git add -A && git commit -m "chore: final cleanup after MCP-only refactor"
```

---

## Phase 2 — Init Script + .mcp.json.example (motyl-dev)

### Task 12: Create Interactive init:mcp Script

**Files:**
- Create: `motyl-dev/scripts/init-mcp.ts`
- Modify: `motyl-dev/package.json` — update `init:mcp` script

**Step 1: Write the init-mcp.ts script**

```typescript
import { resolve, join } from "path";
import { existsSync } from "fs";
import { writeFileSync } from "fs";
import { execSync } from "child_process";
import * as readline from "readline";

const NEWSLETTER_AI_REPO = "git@github.com:gmotyl/newsletter-ai.git";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string, defaultVal?: string): Promise<string> {
  const suffix = defaultVal ? ` [${defaultVal}]` : "";
  return new Promise((resolve) => {
    rl.question(`${question}${suffix}: `, (answer) => {
      resolve(answer.trim() || defaultVal || "");
    });
  });
}

async function main() {
  console.log("\n🔧 MCP Configuration Setup\n");

  // Step 1: motyl-dev path
  const cwd = process.cwd();
  const motylDevDir = await ask("Path to motyl-dev", cwd);
  const resolvedMotylDev = resolve(motylDevDir);

  // Step 2: newsletter-ai path
  const defaultNewsletterAi = resolve(resolvedMotylDev, "../newsletter-ai");
  const newsletterAiDir = await ask("Path to newsletter-ai", defaultNewsletterAi);
  const resolvedNewsletterAi = resolve(newsletterAiDir);

  // Step 3: Check if newsletter-ai exists
  if (!existsSync(resolvedNewsletterAi) || !existsSync(join(resolvedNewsletterAi, "package.json"))) {
    const shouldClone = await ask(
      `newsletter-ai not found at ${resolvedNewsletterAi}. Clone from GitHub?`,
      "yes"
    );
    if (shouldClone.toLowerCase().startsWith("y")) {
      console.log("\n📦 Cloning newsletter-ai...");
      execSync(`git clone ${NEWSLETTER_AI_REPO} "${resolvedNewsletterAi}"`, { stdio: "inherit" });
      console.log("📦 Installing dependencies...");
      execSync("pnpm install", { cwd: resolvedNewsletterAi, stdio: "inherit" });
    } else {
      console.log("Skipping clone. You can set up newsletter-ai manually later.");
    }
  }

  // Step 4: Narrator persona
  const persona = await ask("Narrator persona", "Scott Hanselman");

  // Step 5: Output year
  const currentYear = new Date().getFullYear();
  const outputYear = await ask("Output year", String(currentYear));

  // Step 6: Generate .mcp.json
  const mcpConfig = {
    mcpServers: {
      "newsletter-ai": {
        command: join(resolvedNewsletterAi, "node_modules/.bin/tsx"),
        args: [join(resolvedNewsletterAi, "src/mcp/index.ts")],
        cwd: resolvedNewsletterAi,
        env: {
          PROJECT_DIR: resolvedNewsletterAi,
          OUTPUT_PATH: join(resolvedMotylDev, "news", outputYear),
          NARRATOR_PERSONA: persona,
        },
      },
    },
  };

  const outputPath = join(resolvedMotylDev, ".mcp.json");
  writeFileSync(outputPath, JSON.stringify(mcpConfig, null, 2) + "\n");

  console.log(`\n✅ Created ${outputPath}`);
  console.log("\nConfiguration:");
  console.log(`  newsletter-ai: ${resolvedNewsletterAi}`);
  console.log(`  motyl-dev:     ${resolvedMotylDev}`);
  console.log(`  output:        ${join(resolvedMotylDev, "news", outputYear)}`);
  console.log(`  persona:       ${persona}`);
  console.log("\nRun 'claude' to start using the MCP tools.\n");

  rl.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

**Step 2: Update package.json init:mcp script**

```json
"init:mcp": "tsx scripts/init-mcp.ts"
```

**Step 3: Test the script**

```bash
pnpm init:mcp
```

**Step 4: Commit**

```bash
git add scripts/init-mcp.ts package.json && git commit -m "feat: interactive init:mcp script with clone support"
```

---

### Task 13: Update .mcp.json.example

**Files:**
- Modify: `motyl-dev/.mcp.json.example`

**Step 1: Rewrite .mcp.json.example**

```json
{
  "mcpServers": {
    "newsletter-ai": {
      "command": "/absolute/path/to/newsletter-ai/node_modules/.bin/tsx",
      "args": ["/absolute/path/to/newsletter-ai/src/mcp/index.ts"],
      "cwd": "/absolute/path/to/newsletter-ai",
      "env": {
        "PROJECT_DIR": "/absolute/path/to/newsletter-ai",
        "OUTPUT_PATH": "/absolute/path/to/motyl-dev/news/2026",
        "NARRATOR_PERSONA": "Scott Hanselman"
      }
    }
  }
}
```

Add a comment in the README or a separate `MCP_SETUP.md` explaining:
- Run `pnpm init:mcp` for interactive setup
- Or copy `.mcp.json.example` and replace paths manually

**Step 2: Commit**

```bash
git add .mcp.json.example && git commit -m "docs: update .mcp.json.example with clearer path format"
```

---

## Phase 3 — Settings UI

### Task 14: Scaffold Astro + Refine + Mantine App

**Files:**
- Create: `newsletter-ai/settings/` — new Astro project

**Step 1: Initialize Astro project**

```bash
cd newsletter-ai
pnpm create astro settings -- --template minimal --no-install
```

**Step 2: Add dependencies**

```bash
cd settings
pnpm add @astrojs/react react react-dom
pnpm add @refinedev/core @refinedev/simple-rest
pnpm add @mantine/core @mantine/hooks @mantine/form @mantine/notifications @emotion/react
pnpm add @refinedev/mantine
```

**Step 3: Configure Astro for React islands**

Edit `settings/astro.config.mjs`:
```javascript
import { defineConfig } from "astro";
import react from "@astrojs/react";

export default defineConfig({
  integrations: [react()],
  server: { port: 4321 },
});
```

**Step 4: Commit**

```bash
git add settings/ && git commit -m "feat: scaffold Astro + Refine + Mantine settings app"
```

---

### Task 15: Create Fastify API Backend

**Files:**
- Create: `newsletter-ai/settings/api/server.ts` — Fastify server
- Create: `newsletter-ai/settings/api/routes/config.ts`
- Create: `newsletter-ai/settings/api/routes/prompt.ts`
- Create: `newsletter-ai/settings/api/routes/newsletters.ts`

**Step 1: Add Fastify dependency**

```bash
cd settings
pnpm add fastify @fastify/cors
```

**Step 2: Write API server**

`settings/api/server.ts`:
```typescript
import Fastify from "fastify";
import cors from "@fastify/cors";
import { configRoutes } from "./routes/config.js";
import { promptRoutes } from "./routes/prompt.js";
import { newsletterRoutes } from "./routes/newsletters.js";

const server = Fastify({ logger: true });

await server.register(cors, { origin: "http://localhost:4321" });
await server.register(configRoutes, { prefix: "/api" });
await server.register(promptRoutes, { prefix: "/api" });
await server.register(newsletterRoutes, { prefix: "/api" });

server.listen({ port: 3001 }, (err) => {
  if (err) throw err;
  console.log("Settings API running on http://localhost:3001");
});
```

**Step 3: Write config routes**

`settings/api/routes/config.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { readFileSync, writeFileSync } from "fs";
import { load, dump } from "js-yaml";
import { resolve } from "path";

const CONFIG_PATH = resolve(process.env.PROJECT_DIR || "../", "config.yaml");

export async function configRoutes(server: FastifyInstance) {
  server.get("/config", async () => {
    const content = readFileSync(CONFIG_PATH, "utf-8");
    return load(content);
  });

  server.put("/config", async (request) => {
    const yaml = dump(request.body, { lineWidth: -1 });
    writeFileSync(CONFIG_PATH, yaml);
    return { ok: true };
  });
}
```

**Step 4: Write prompt routes**

`settings/api/routes/prompt.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

const PROMPT_PATH = resolve(process.env.PROJECT_DIR || "../", "PROMPT.md");

export async function promptRoutes(server: FastifyInstance) {
  server.get("/prompt", async () => {
    return { content: readFileSync(PROMPT_PATH, "utf-8") };
  });

  server.put("/prompt", async (request) => {
    const { content } = request.body as { content: string };
    writeFileSync(PROMPT_PATH, content);
    return { ok: true };
  });
}
```

**Step 5: Write newsletter detection routes**

`settings/api/routes/newsletters.ts`:
```typescript
import { FastifyInstance } from "fastify";
import { getEmailCredentials } from "../../../src/config/config.js";
import { withConnection, searchNewsletters, fetchEmailContent } from "../../../src/services/imap/index.js";

// Heuristic patterns for newsletter detection
const NEWSLETTER_INDICATORS = {
  headers: ["list-unsubscribe", "x-campaign", "x-mailer", "precedence"],
  platforms: ["substack.com", "beehiiv.com", "convertkit.com", "mailchimp.com",
              "buttondown.email", "revue.email", "ghost.io", "sendfox.com"],
};

export async function newsletterRoutes(server: FastifyInstance) {
  // Detect potential newsletters not in config
  server.get("/newsletters/detect", async () => {
    const credentials = getEmailCredentials();
    // Scan recent emails, check headers for newsletter indicators
    // Filter out senders already in config.yaml
    // Return list of potential newsletters with sender, subject, frequency
    return await withConnection(credentials, async (conn) => {
      // Implementation: search recent emails, check headers, group by sender
      // Return candidates
    });
  });

  // Explicit search by sender or subject
  server.get("/newsletters/search", async (request) => {
    const { q } = request.query as { q: string };
    const credentials = getEmailCredentials();
    return await withConnection(credentials, async (conn) => {
      // Search IMAP for matching emails
      // Return matches with sender, subject, date
    });
  });

  // Merge detected newsletter pattern into config
  server.post("/newsletters/merge", async (request) => {
    const { name, from, subject, hashtags } = request.body as any;
    // Read config.yaml, add new pattern, write back
    return { ok: true };
  });
}
```

**Step 6: Add scripts to settings/package.json**

```json
{
  "scripts": {
    "dev": "concurrently \"astro dev\" \"tsx api/server.ts\"",
    "build": "astro build",
    "api": "tsx api/server.ts"
  }
}
```

**Step 7: Commit**

```bash
git add settings/api/ && git commit -m "feat: Fastify API backend for settings UI"
```

---

### Task 16: Build Newsletter List Page

**Files:**
- Create: `settings/src/pages/index.astro` — main layout
- Create: `settings/src/components/NewsletterList.tsx` — React island

**Step 1: Create main page layout**

`settings/src/pages/index.astro`:
```astro
---
import Layout from "../layouts/Layout.astro";
import NewsletterList from "../components/NewsletterList";
---
<Layout title="Newsletter Settings">
  <main>
    <h1>Newsletter Settings</h1>
    <NewsletterList client:load />
  </main>
</Layout>
```

**Step 2: Create NewsletterList component**

Uses Refine's `useList` hook + Mantine Table to display newsletters from config.yaml with:
- Name, from pattern, enabled toggle, hashtags
- Edit button → opens modal with full pattern editing
- Delete button with confirmation

**Step 3: Commit**

```bash
git add settings/src/ && git commit -m "feat: newsletter list page with Refine + Mantine"
```

---

### Task 17: Build Newsletter Detection Page

**Files:**
- Create: `settings/src/pages/detect.astro`
- Create: `settings/src/components/NewsletterDetection.tsx`

**Step 1: Detection UI**

Shows a "Scan Mailbox" button that calls `GET /api/newsletters/detect`. Displays results in a table with:
- Sender email, detected platform, sample subjects
- "Add to Config" button per row → calls `POST /api/newsletters/merge`

**Step 2: Search UI**

Text input for explicit search by email/subject. Calls `GET /api/newsletters/search?q=...`. Same merge-to-config flow.

**Step 3: Commit**

```bash
git add settings/src/ && git commit -m "feat: newsletter detection and search UI"
```

---

### Task 18: Build Prompt Editor Page

**Files:**
- Create: `settings/src/pages/prompt.astro`
- Create: `settings/src/components/PromptEditor.tsx`

**Step 1: Prompt editor**

Textarea with live markdown preview. Loads from `GET /api/prompt`, saves via `PUT /api/prompt`. Mantine RichTextEditor or simple textarea + markdown preview.

**Step 2: Commit**

```bash
git add settings/src/ && git commit -m "feat: prompt editor page"
```

---

### Task 19: Build Settings Page (Persona, Config)

**Files:**
- Create: `settings/src/pages/settings.astro`
- Create: `settings/src/components/SettingsForm.tsx`

**Step 1: Settings form**

Refine form with Mantine inputs for:
- Narrator persona (text input with suggestions)
- IMAP credentials (host, port, user, password — masked)
- Output path
- Output language
- Processing options (mark as read, auto delete, message limit)
- Scraper options (timeout, retry attempts)
- Content filters (skip topics, focus topics, blacklisted URLs)

**Step 2: Commit**

```bash
git add settings/src/ && git commit -m "feat: settings page with persona and config editing"
```

---

### Task 20: Add `npm run settings` to newsletter-ai

**Files:**
- Modify: `newsletter-ai/package.json` — add `settings` script

**Step 1: Add script**

```json
"settings": "cd settings && pnpm dev"
```

**Step 2: Test**

```bash
pnpm settings
```
Expected: Astro dev server starts on :4321, Fastify API on :3001

**Step 3: Commit**

```bash
git add package.json && git commit -m "feat: add 'pnpm settings' command for local UI"
```

---

### Task 21: Final Integration Test

**Step 1: Clean build of newsletter-ai**

```bash
rm -rf dist/ && pnpm build
```

**Step 2: Run all tests**

```bash
pnpm test
```

**Step 3: Test MCP server**

```bash
timeout 5 pnpm run:mcp || true
```

**Step 4: Test settings UI**

```bash
pnpm settings
```
Visit http://localhost:4321, verify:
- Newsletter list loads from config.yaml
- Enable/disable toggles work
- Detection scan works (if IMAP credentials configured)
- Prompt editor loads and saves
- Settings form loads and saves

**Step 5: Test init:mcp in motyl-dev**

```bash
cd ../motyl-dev && pnpm init:mcp
```

**Step 6: Commit any remaining fixes**

```bash
git add -A && git commit -m "chore: final integration validation"
```
