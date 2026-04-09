const LOGIN_KEY = "mock_logged_in";

export function isLoggedIn() {
  return !!uni.getStorageSync(LOGIN_KEY);
}

export function setLoggedIn(value) {
  if (value) {
    uni.setStorageSync(LOGIN_KEY, 1);
  } else {
    uni.removeStorageSync(LOGIN_KEY);
  }
}
