<template>
  <view v-if="visible" class="overlay">
    <view class="popup card">
      <view class="popup-title">登录后继续</view>
      <view class="popup-desc">该操作需要登录后才可使用。</view>
      <view class="agree-row">
        <checkbox :checked="agreed" @click="toggleAgree" />
        <text class="agree-text">我已阅读并同意《用户协议》《隐私政策》</text>
      </view>
      <view class="primary-button login-btn" :class="{ disabled: !agreed }" @click="onLoginClick">
        微信一键登录
      </view>
      <view class="cancel-btn" @click="$emit('close')">取消</view>
    </view>
  </view>
</template>

<script>
export default {
  name: "LoginGatePopup",
  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      agreed: false
    };
  },
  methods: {
    toggleAgree() {
      this.agreed = !this.agreed;
    },
    onLoginClick() {
      if (!this.agreed) return;
      this.$emit("login");
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.36);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 999;
}

.popup {
  width: calc(100% - 24px);
  margin: 12px;
  padding: 16px;
}

.popup-title {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 6px;
}

.popup-desc {
  font-size: 13px;
  color: $text-secondary;
  margin-bottom: 14px;
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

.login-btn {
  margin-bottom: 8px;
}

.login-btn.disabled {
  background: #d1d5db;
  color: #f9fafb;
}

.cancel-btn {
  text-align: center;
  color: $text-secondary;
  font-size: 14px;
  line-height: 30px;
}
</style>
