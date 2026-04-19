import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./config.js";
import v1Routes from "./routes/v1/index.js";

const app = Fastify({ logger: true });

// uni-app H5 等对 DELETE 仍可能带 Content-Type: application/json 且 Content-Length: 0，
// Fastify 默认解析器会抛 FST_ERR_CTP_EMPTY_JSON_BODY
app.removeContentTypeParser("application/json");
app.addContentTypeParser("application/json", { parseAs: "string" }, (req, body, done) => {
  const raw = body === undefined || body === null ? "" : String(body);
  if (raw.trim() === "") {
    done(null, {});
    return;
  }
  try {
    done(null, JSON.parse(raw));
  } catch (err) {
    err.statusCode = 400;
    done(err, undefined);
  }
});

await app.register(cors, { origin: true });
await app.register(v1Routes, { prefix: "/api/v1" });

app.get("/health", async () => ({ ok: true, service: "manlog-server" }));

try {
  await app.listen({ port: config.port, host: "0.0.0.0" });
  app.log.info(`ManLog API http://localhost:${config.port}  (api prefix /api/v1)`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
