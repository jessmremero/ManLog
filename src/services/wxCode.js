/**
 * 微信小程序返回真实 code；其它端使用固定 dev code，便于本地联调同一 openid。
 */
export function getWxCode() {
  return new Promise((resolve, reject) => {
    // #ifdef MP-WEIXIN
    uni.login({
      provider: "weixin",
      success: (res) => resolve(res.code || ""),
      fail: reject
    });
    // #endif
    // #ifndef MP-WEIXIN
    resolve("h5-dev-login");
    // #endif
  });
}
