import { ok, fail } from "../../lib/response.js";
import * as recordService from "../../services/recordService.js";

export async function listHandler(req) {
  const data = await recordService.listRecords(req.userId, req.query);
  return ok(data);
}

export async function getOneHandler(req, reply) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return reply.code(400).send(fail(40003, "无效 id"));
  const row = await recordService.getRecordById(req.userId, id);
  if (!row) return reply.code(404).send(fail(40401, "记录不存在"));
  return ok(row);
}

export async function createHandler(req, reply) {
  const b = req.body || {};
  try {
    if (!b.eventType || !b.eventDate) {
      return reply.code(400).send(fail(40004, "eventType 与 eventDate 必填"));
    }
    const row = await recordService.createRecord(req.userId, b);
    return reply.code(201).send(ok(row));
  } catch (e) {
    if (e.code === 40001) return reply.code(400).send(fail(40001, "事件类型无效"));
    if (e.message === "INVALID_DATETIME") {
      return reply.code(400).send(fail(40005, "日期或时间无效"));
    }
    throw e;
  }
}

export async function updateHandler(req, reply) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id)) return reply.code(400).send(fail(40003, "无效 id"));
  const b = req.body || {};
  try {
    if (!b.eventType || !b.eventDate) {
      return reply.code(400).send(fail(40004, "eventType 与 eventDate 必填"));
    }
    const row = await recordService.updateRecord(req.userId, id, b);
    if (!row) return reply.code(404).send(fail(40401, "记录不存在"));
    return ok(row);
  } catch (e) {
    if (e.code === 40001) return reply.code(400).send(fail(40001, "事件类型无效"));
    if (e.message === "INVALID_DATETIME") {
      return reply.code(400).send(fail(40005, "日期或时间无效"));
    }
    throw e;
  }
}

export async function deleteHandler(req, reply) {
  const id = Number(req.params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return reply.code(400).send(fail(40003, "无效 id"));
  }
  const okDel = await recordService.softDeleteRecord(req.userId, id);
  if (!okDel) return reply.code(404).send(fail(40401, "记录不存在"));
  return reply.send(ok({ deleted: true }));
}
