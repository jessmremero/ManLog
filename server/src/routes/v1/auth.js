import crypto from "crypto";
import { pool } from "../../db/pool.js";
import { ok, fail } from "../../lib/response.js";
import { signToken } from "../../lib/jwt.js";
import { config } from "../../config.js";

function openidFromCode(code) {
  const h = crypto.createHash("sha256").update(String(code), "utf8").digest("hex").slice(0, 32);
  return `dev_${h}`;
}

export async function wxLoginHandler(req, reply) {
  const code = req.body?.code;
  if (!code || typeof code !== "string") {
    return reply.code(400).send(fail(40000, "缺少 code"));
  }

  const openid = openidFromCode(code.trim());

  const [found] = await pool.execute("SELECT id FROM users WHERE openid = :openid LIMIT 1", {
    openid
  });

  let userId;
  if (found.length) {
    userId = found[0].id;
  } else {
    const [ins] = await pool.execute("INSERT INTO users (openid) VALUES (:openid)", { openid });
    userId = ins.insertId;
  }

  const token = signToken(userId);
  return ok({
    token,
    expiresIn: config.jwt.expiresInSec,
    userId
  });
}

export async function logoutHandler() {
  return ok(null);
}
