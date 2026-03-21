import type { FastifyInstance } from "fastify";
import { readFileSync, writeFileSync } from "fs";
import { load, dump } from "js-yaml";
import { resolve } from "path";

function getConfigPath() {
  const root =
    process.env.PROJECT_DIR || resolve(import.meta.dirname, "../../../");
  return resolve(root, "config.yaml");
}

export async function configRoutes(server: FastifyInstance) {
  server.get("/config", async () => {
    const content = readFileSync(getConfigPath(), "utf-8");
    return load(content);
  });

  server.put("/config", async (request) => {
    const yaml = dump(request.body, { lineWidth: -1, noRefs: true });
    writeFileSync(getConfigPath(), yaml);
    return { ok: true };
  });
}
