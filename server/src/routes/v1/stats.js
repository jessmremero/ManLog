import { ok, fail } from "../../lib/response.js";
import * as statsService from "../../services/statsService.js";

export async function overviewHandler(req, reply) {
  try {
    const data = await statsService.overview(req.userId, req.query);
    return ok(data);
  } catch (e) {
    if (e.code === 40002) return reply.code(400).send(fail(40002, "dimension 无效"));
    throw e;
  }
}
