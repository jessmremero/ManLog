export function showAppLoading(title = "请稍候") {
  uni.showLoading({ title, mask: true });
}

export function hideAppLoading() {
  uni.hideLoading();
}

export function toastSuccess(title) {
  uni.showToast({ title, icon: "success", duration: 1800 });
}

export function toastError(title) {
  uni.showToast({ title, icon: "none", duration: 2200 });
}

export function toastInfo(title) {
  uni.showToast({ title, icon: "none", duration: 2000 });
}

/**
 * 模拟异步保存等场景；失败时由 onError 提示并可重试
 */
export function runWithLoading(promiseFn, { title = "请稍候", onError } = {}) {
  showAppLoading(title);
  return Promise.resolve()
    .then(() => promiseFn())
    .catch((e) => {
      const msg = (e && e.message) || "操作失败，请重试";
      toastError(msg);
      if (typeof onError === "function") onError(e);
      throw e;
    })
    .finally(() => {
      hideAppLoading();
    });
}
