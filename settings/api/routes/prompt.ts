import type { FastifyInstance } from "fastify";
import { readFileSync, writeFileSync } from "fs";
import { resolve } from "path";

function getPromptPath() {
  const root =
    process.env.PROJECT_DIR || resolve(import.meta.dirname, "../../../");
  return resolve(root, "PROMPT.md");
}

export async function promptRoutes(server: FastifyInstance) {
  server.get("/prompt", async () => {
    return { content: readFileSync(getPromptPath(), "utf-8") };
  });

  server.put("/prompt", async (request) => {
    const { content } = request.body as { content: string };
    writeFileSync(getPromptPath(), content);
    return { ok: true };
  });
}
