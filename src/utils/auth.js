import { useApi } from "@/config/api.js";

const MOCK_KEY = "mock_logged_in";
const TOKEN_KEY = "manlog_token";
const USER_ID_KEY = "manlog_user_id";
const LOGIN_PAGE = "/pages/auth/login";

let relaunchLoginScheduled = false;

/** API 模式下 401 / 登录失效：清会话并统一进入登录页（合并并发请求只跳转一次）。 */
export function relaunchToLoginAfterUnauthorized() {
  if (!useApi()) return;
  if (relaunchLoginScheduled) return;
  relaunchLoginScheduled = true;
  uni.showToast({ title: "登录已失效，请重新登录", icon: "none" });
  setTimeout(() => {
    uni.reLaunch({
      url: LOGIN_PAGE,
      complete: () => {
        relaunchLoginScheduled = false;
      },
      fail: () => {
        relaunchLoginScheduled = false;
      }
    });
  }, 320);
}

export function getToken() {
  try {
    return uni.getStorageSync(TOKEN_KEY) || "";
  } catch {
    return "";
  }
}

export function getUserId() {
  try {
    const v = uni.getStorageSync(USER_ID_KEY);
    return v != null && v !== "" ? Number(v) : null;
  } catch {
    return null;
  }
}

export function setApiSession({ token, userId }) {
  uni.setStorageSync(TOKEN_KEY, token);
  if (userId != null) uni.setStorageSync(USER_ID_KEY, String(userId));
  uni.removeStorageSync(MOCK_KEY);
}

export function clearAuth() {
  uni.removeStorageSync(TOKEN_KEY);
  uni.removeStorageSync(USER_ID_KEY);
  uni.removeStorageSync(MOCK_KEY);
}

export function isLoggedIn() {
  if (useApi()) return !!getToken();
  try {
    return !!uni.getStorageSync(MOCK_KEY);
  } catch {
    return false;
  }
}

/** 仅 mock 模式：演示用本地标记。API 模式请用 performWxLogin + setApiSession。 */
export function setLoggedIn(value) {
  if (useApi()) {
    if (!value) clearAuth();
    return;
  }
  if (value) {
    uni.setStorageSync(MOCK_KEY, 1);
  } else {
    clearAuth();
  }
}
