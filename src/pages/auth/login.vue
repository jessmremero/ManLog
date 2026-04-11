<template>
  <view class="page-container">
    <view v-if="!success" class="login-wrap">
      <view class="brand-area">
        <text class="brand-title">ManLog</text>
        <text class="brand-sub">私密记录，科学观察</text>
      </view>

      <view class="card intro-card">
        <view class="intro-row">仅用于个人记录与统计</view>
        <view class="intro-row">数据云端加密存储</view>
        <view class="intro-row">你可随时管理自己的记录</view>
      </view>

      <view class="agree-row">
        <checkbox :checked="agreed" @click="agreed = !agreed" />
        <text class="agree-text">我已阅读并同意《用户协议》《隐私政策》</text>
      </view>

      <view class="primary-button" :class="{ disabled: !agreed }" @click="doLogin">微信一键登录</view>
      <view class="ghost-btn" @click="goBack">取消</view>
    </view>

    <view v-else class="success-wrap card">
      <text class="success-title">登录成功</text>
      <text class="success-sub">正在返回上一页...</text>
    </view>
  </view>
</template>

<script>
import { setLoggedIn } from "@/utils/auth";
import { track } from "@/utils/track";

export default {
  data() {
    return {
      agreed: false,
      success: false
    };
  },
  methods: {
    doLogin() {
      if (!this.agreed) return;
      setLoggedIn(true);
      track("login_success", { via: "page" });
      this.success = true;
      setTimeout(() => {
        uni.navigateBack();
      }, 650);
    },
    goBack() {
      uni.navigateBack();
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.login-wrap {
  padding-top: 60px;
}

.brand-area {
  text-align: center;
  margin-bottom: 20px;
}

.brand-title {
  font-size: 38px;
  font-weight: 800;
  color: $text-primary;
  display: block;
}

.brand-sub {
  margin-top: 6px;
  font-size: 14px;
  color: $text-secondary;
  display: block;
}

.intro-card {
  padding: 16px;
  margin-bottom: 16px;
}

.intro-row {
  font-size: 14px;
  color: $text-primary;
  margin-bottom: 10px;
}

.intro-row:last-child {
  margin-bottom: 0;
}

.agree-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
}

.agree-text {
  font-size: 12px;
  color: $text-secondary;
}

.primary-button.disabled {
  background: #d1d5db;
  color: #f9fafb;
}

.ghost-btn {
  margin-top: 10px;
  height: 40px;
  line-height: 40px;
  text-align: center;
  border-radius: 10px;
  border: 1px solid $border;
  color: $text-secondary;
}

.success-wrap {
  margin-top: 180px;
  padding: 24px;
  text-align: center;
}

.success-title {
  font-size: 28px;
  font-weight: 700;
  display: block;
}

.success-sub {
  display: block;
  margin-top: 8px;
  color: $text-secondary;
}
</style>
