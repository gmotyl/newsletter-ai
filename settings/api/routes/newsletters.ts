import type { FastifyInstance } from "fastify";

export async function newsletterRoutes(server: FastifyInstance) {
  // Detect potential newsletters not in config (stub)
  server.get("/newsletters/detect", async () => {
    return {
      candidates: [],
      message: "Newsletter detection not yet implemented",
    };
  });

  // Search IMAP by sender/subject (stub)
  server.get("/newsletters/search", async (request) => {
    const { q } = request.query as { q?: string };
    return { results: [], query: q, message: "Search not yet implemented" };
  });

  // Merge detected pattern into config
  server.post("/newsletters/merge", async () => {
    // Will read config.yaml, add new pattern, write back
    return { ok: false, message: "Merge not yet implemented" };
  });
}
