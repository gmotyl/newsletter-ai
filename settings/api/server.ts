import { config } from "dotenv";
import { resolve } from "path";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { configRoutes } from "./routes/config.js";
import { promptRoutes } from "./routes/prompt.js";
import { newsletterRoutes } from "./routes/newsletters.js";

// Load .env from project root
config({ path: resolve(import.meta.dirname, "../../.env") });

const server = Fastify({ logger: true });

await server.register(cors, { origin: "http://localhost:4321" });
await server.register(configRoutes, { prefix: "/api" });
await server.register(promptRoutes, { prefix: "/api" });
await server.register(newsletterRoutes, { prefix: "/api" });

await server.listen({ port: 3001 });
console.log("Settings API running on http://localhost:3001");
