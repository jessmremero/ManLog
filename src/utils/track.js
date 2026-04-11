/**
 * 前端埋点占位：联调后可接微信数据上报或自建埋点服务
 */
export function track(event, payload = {}) {
  // #ifdef H5
  if (typeof console !== "undefined" && console.debug) {
    console.debug("[ManLog track]", event, payload);
  }
  // #endif
}
