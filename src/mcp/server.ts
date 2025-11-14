// MCP Server Implementation
// Exposes newsletter-ai functionality as MCP tools

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";

// Import all MCP tools
import { getNewslettersCount } from "./tools/getNewslettersCount.js";
import { prepareNewsletters } from "./tools/prepareNewsletters.js";
import { getNewslettersList } from "./tools/getNewslettersList.js";
import { getNewsletterLinks } from "./tools/getNewsletterLinks.js";
import { scrapeArticle } from "./tools/scrapeArticle.js";
import { getConfig } from "./tools/getConfig.js";
import { getPromptTemplate } from "./tools/getPromptTemplate.js";
import { saveArticle } from "./tools/saveArticle.js";
import { markNewslettersAsProcessed } from "./tools/markNewslettersAsProcessed.js";

// Define all available tools
const TOOLS: Tool[] = [
  {
    name: "get_newsletters_count",
    description:
      "Returns count of newsletters in mailbox (all newsletters by default, or filtered by optional pattern parameter)",
    inputSchema: {
      type: "object",
      properties: {
        pattern: {
          type: "string",
          description: "Optional pattern to filter newsletters (e.g., 'daily.dev')",
        },
      },
    },
  },
  {
    name: "prepare_newsletters",
    description:
      "Fetches N newsletters from IMAP, extracts/cleans links, and writes to LINKS.yaml. This replaces any existing LINKS.yaml file. Respects autoDelete from config.json unless safeMode=true.",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          oneOf: [
            { type: "number", minimum: 1 },
            { type: "string", enum: ["all"] },
          ],
          description: "Number of newsletters to process or 'all'",
        },
        pattern: {
          type: "string",
          description: "Optional pattern to filter newsletters",
        },
        safeMode: {
          type: "boolean",
          description: "If true, prevents email deletion (overrides config.json autoDelete setting)",
        },
      },
      required: ["limit"],
    },
  },
  {
    name: "get_newsletters_list",
    description: "Returns list of newsletters from LINKS.yaml",
    inputSchema: {
      type: "object",
      properties: {
        yamlPath: {
          type: "string",
          description: "Path to LINKS.yaml (defaults to 'LINKS.yaml')",
        },
      },
    },
  },
  {
    name: "get_newsletter_links",
    description: "Returns links for a specific newsletter from LINKS.yaml",
    inputSchema: {
      type: "object",
      properties: {
        newsletterName: {
          type: "string",
          description: "Name of the newsletter",
        },
        yamlPath: {
          type: "string",
          description: "Path to LINKS.yaml (defaults to 'LINKS.yaml')",
        },
      },
      required: ["newsletterName"],
    },
  },
  {
    name: "scrape_article",
    description: "Scrapes content for a given URL using existing scraper",
    inputSchema: {
      type: "object",
      properties: {
        url: {
          type: "string",
          description: "URL to scrape",
        },
      },
      required: ["url"],
    },
  },
  {
    name: "get_config",
    description: "Returns relevant configuration from .env",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_prompt_template",
    description: "Returns PROMPT.md content for article generation",
    inputSchema: {
      type: "object",
      properties: {
        promptPath: {
          type: "string",
          description: "Path to PROMPT.md (defaults to 'PROMPT.md')",
        },
      },
    },
  },
  {
    name: "save_article",
    description: "Saves generated .md file to OUTPUT_PATH",
    inputSchema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "Markdown content with frontmatter",
        },
        newsletterName: {
          type: "string",
          description: "Optional newsletter name for filename generation",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "mark_newsletters_as_processed",
    description:
      "Marks newsletters from LINKS.yaml as read and optionally deletes them. Respects config.json autoDelete unless safeMode=true.",
    inputSchema: {
      type: "object",
      properties: {
        safeMode: {
          type: "boolean",
          description: "If true, prevents email deletion (overrides config.json autoDelete setting)",
        },
      },
    },
  },
];

export async function createMCPServer() {
  const server = new Server(
    {
      name: "newsletter-ai",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Handle tool list requests
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools: TOOLS };
  });

  // Handle tool execution requests
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result: any;

      switch (name) {
        case "get_newsletters_count":
          result = await getNewslettersCount(
            args?.pattern as string | undefined
          );
          break;

        case "prepare_newsletters":
          if (!args?.limit) {
            throw new Error("Missing required parameter: limit");
          }
          result = await prepareNewsletters(
            args.limit as number | "all",
            args?.pattern as string | undefined,
            args?.safeMode as boolean | undefined
          );
          break;

        case "get_newsletters_list":
          result = await getNewslettersList(args?.yamlPath as string | undefined);
          break;

        case "get_newsletter_links":
          if (!args?.newsletterName) {
            throw new Error("Missing required parameter: newsletterName");
          }
          result = await getNewsletterLinks(
            args.newsletterName as string,
            args?.yamlPath as string | undefined
          );
          break;

        case "scrape_article":
          if (!args?.url) {
            throw new Error("Missing required parameter: url");
          }
          result = await scrapeArticle(args.url as string);
          break;

        case "get_config":
          result = await getConfig();
          break;

        case "get_prompt_template":
          result = await getPromptTemplate(args?.promptPath as string | undefined);
          break;

        case "save_article":
          if (!args?.content) {
            throw new Error("Missing required parameter: content");
          }
          result = await saveArticle(
            args.content as string,
            args?.newsletterName as string | undefined
          );
          break;

        case "mark_newsletters_as_processed":
          result = await markNewslettersAsProcessed(
            args?.safeMode as boolean | undefined
          );
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

export async function startMCPServer() {
  const server = await createMCPServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Handle shutdown gracefully
  process.on("SIGINT", async () => {
    await server.close();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.close();
    process.exit(0);
  });

  console.error("Newsletter AI MCP Server started");
}
