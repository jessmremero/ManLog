/**
 * 未配置 VITE_API_BASE 时使用本地 mock（recordStore / aggregateRecords）。
 * 开发示例：在 .env.development 中设置 VITE_API_BASE=/api/v1 ，并启动后端 + Vite 代理。
 */
export function getApiBase() {
  const v = import.meta.env.VITE_API_BASE;
  if (v == null || typeof v !== "string") return "";
  return v.trim();
}

export function useApi() {
  return getApiBase().length > 0;
}
