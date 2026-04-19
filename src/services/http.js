import { getApiBase, useApi } from "@/config/api.js";
import { clearAuth, getToken, relaunchToLoginAfterUnauthorized } from "@/utils/auth.js";

/**
 * @param {{ url: string, method?: string, data?: object, header?: object }} options
 * url 相对 /api/v1，例如 /auth/wx-login
 */
export function request(options) {
  if (!useApi()) {
    return Promise.reject(new Error("API 未配置（VITE_API_BASE 为空）"));
  }

  const base = getApiBase().replace(/\/$/, "");
  const path = options.url.startsWith("/") ? options.url : `/${options.url}`;
  const url = `${base}${path}`;

  const method = options.method || "GET";
  const header = { ...(options.header || {}) };
  // DELETE 无 body 时若带 application/json，Fastify 会报 FST_ERR_CTP_EMPTY_JSON_BODY
  if (method === "DELETE") {
    delete header["Content-Type"];
    delete header["content-type"];
  } else if (!header["Content-Type"] && !header["content-type"]) {
    header["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) header.Authorization = `Bearer ${token}`;

  return new Promise((resolve, reject) => {
    const payload = {
      url,
      method,
      header,
      success: (res) => {
        if (res.statusCode === 401) {
          clearAuth();
          relaunchToLoginAfterUnauthorized();
          reject(new Error("UNAUTHORIZED"));
          return;
        }
        const body = res.data;
        if (typeof body !== "object" || body === null) {
          reject(new Error("响应格式错误"));
          return;
        }
        if (body.code === 40101) {
          clearAuth();
          relaunchToLoginAfterUnauthorized();
          reject(new Error("UNAUTHORIZED"));
          return;
        }
        if (body.code !== 0) {
          reject(new Error(body.message || "请求失败"));
          return;
        }
        resolve(body.data);
      },
      fail: (err) => {
        reject(err || new Error("网络错误"));
      }
    };
    // DELETE 带 JSON body 时部分运行时会触发服务端/网关解析异常；本 API 删除无需 body
    if (method !== "DELETE" && options.data !== undefined) {
      payload.data = options.data;
    }
    uni.request(payload);
  });
}
