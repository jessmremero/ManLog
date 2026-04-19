export function ok(data) {
  return { code: 0, message: "ok", data };
}

export function fail(code, message) {
  return { code, message, data: null };
}
