import { request } from "./http.js";

export async function fetchStatsOverview(params) {
  return request({
    url: "/stats/overview",
    method: "GET",
    data: {
      dimension: params.dimension,
      anchorDate: params.anchorDate,
      eventType: params.eventType === "ALL" ? undefined : params.eventType
    }
  });
}
