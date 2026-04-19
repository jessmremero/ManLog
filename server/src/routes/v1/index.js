import { verifyToken } from "../../lib/jwt.js";
import { fail } from "../../lib/response.js";
import { wxLoginHandler, logoutHandler } from "./auth.js";
import * as records from "./records.js";
import * as stats from "./stats.js";

async function authPreHandler(req, reply) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith("Bearer ")) {
    return reply.code(401).send(fail(40101, "未登录或 token 无效"));
  }
  try {
    const payload = verifyToken(h.slice(7));
    req.userId = payload.userId;
  } catch {
    return reply.code(401).send(fail(40101, "未登录或 token 无效"));
  }
}

export default async function v1Routes(f) {
  f.post("/auth/wx-login", wxLoginHandler);
  f.post("/auth/logout", logoutHandler);

  f.register(
    async (pf) => {
      pf.addHook("preHandler", authPreHandler);
      pf.get("/records", records.listHandler);
      pf.post("/records", records.createHandler);
      pf.get("/records/:id", records.getOneHandler);
      pf.put("/records/:id", records.updateHandler);
      pf.delete("/records/:id", records.deleteHandler);
      pf.get("/stats/overview", stats.overviewHandler);
    },
    { prefix: "" }
  );
}
