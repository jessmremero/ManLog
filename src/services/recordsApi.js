import { request } from "./http.js";

const TYPE_LABEL = {
  EMISSION: "生理现象",
  SEX: "亲密互动",
  MASTURBATION: "自我舒缓"
};

/** 列表卡片与 mock 结构一致 */
export function mapRecordToListItem(r) {
  const note = (r.note || "").trim() || "无备注";
  return {
    id: r.id,
    type: r.eventType,
    typeLabel: TYPE_LABEL[r.eventType] || r.eventType,
    datetime: r.datetime,
    note,
    eventType: r.eventType,
    eventDate: r.eventDate,
    eventTime: r.eventTime
  };
}

export async function fetchRecordList(params = {}) {
  const data = await request({
    url: "/records",
    method: "GET",
    data: {
      page: params.page || 1,
      pageSize: params.pageSize || 20,
      eventType: params.eventType,
      startDate: params.startDate,
      endDate: params.endDate
    }
  });
  return {
    list: (data.list || []).map(mapRecordToListItem),
    page: data.page,
    pageSize: data.pageSize,
    total: data.total
  };
}

export async function fetchRecord(id) {
  return request({ url: `/records/${id}`, method: "GET" });
}

export async function createRecordApi(body) {
  return request({ url: "/records", method: "POST", data: body });
}

export async function updateRecordApi(id, body) {
  return request({ url: `/records/${id}`, method: "PUT", data: body });
}

export async function deleteRecordApi(id) {
  const n = Number(id);
  return request({ url: `/records/${n}`, method: "DELETE" });
}
