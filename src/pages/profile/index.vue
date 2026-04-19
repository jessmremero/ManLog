<template>
  <view class="page-container">
    <text class="page-title page-title--profile">我的</text>

    <view class="card profile-card">
      <view v-if="!isLoggedIn" class="profile-head profile-head--guest">
        <view class="avatar avatar--guest">
          <text class="avatar-icon">◯</text>
        </view>
        <view class="guest-title">登录 ManLog</view>
        <view class="muted guest-sub">登录后可记录与查看个人统计</view>
      </view>

      <view v-else class="profile-head">
        <view class="avatar">
          <text class="avatar-icon">◯</text>
        </view>
        <view>
          <view class="name">用户</view>
          <view class="muted">已登录</view>
        </view>
      </view>
      <view
        class="primary-button login-btn"
        :class="{ danger: isLoggedIn }"
        @click="toggleLogin"
      >
        {{ isLoggedIn ? "退出登录" : "微信一键登录" }}
      </view>
    </view>

    <view class="card menu-card">
      <view class="menu-item">
        <text>隐私政策</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item">
        <text>用户协议</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item">
        <text>主题设置</text>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item">
        <text>版本信息 v1.0.0</text>
        <text class="menu-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<script>
import { clearAuth, isLoggedIn } from "@/utils/auth";

export default {
  data() {
    return {
      isLoggedIn: false
    };
  },
  onShow() {
    this.isLoggedIn = isLoggedIn();
  },
  methods: {
    toggleLogin() {
      if (this.isLoggedIn) {
        clearAuth();
        this.isLoggedIn = false;
        uni.showToast({ title: "已退出登录", icon: "none" });
        return;
      }
      uni.navigateTo({ url: "/pages/auth/login" });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.profile-card {
  margin-top: 12px;
  padding: 16px;
}

.page-title--profile {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.2;
}

.profile-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.profile-head--guest {
  flex-direction: column;
  gap: 8px;
  text-align: center;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: #eef0ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar--guest {
  width: 64px;
  height: 64px;
}

.avatar-icon {
  color: #4f46e5;
  font-size: 22px;
  font-weight: 700;
}

.guest-title {
  font-size: 20px;
  font-weight: 700;
  color: $text-primary;
}

.guest-sub {
  font-size: 12px;
}

.name {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 4px;
}

.login-btn {
  margin-top: 8px;
  border-radius: 12px;
}

.login-btn.danger {
  background: #fee2e2;
  color: #ef4444;
}

.menu-card {
  margin-top: 12px;
}

.menu-item {
  height: 52px;
  line-height: 52px;
  padding: 0 14px;
  border-bottom: 1px solid $border;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.menu-arrow {
  color: #9ca3af;
  font-size: 22px;
  line-height: 1;
}

.menu-item:last-child {
  border-bottom: none;
}
</style>
