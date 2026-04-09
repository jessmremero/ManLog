<template>
  <view class="stat-card card">
    <view class="label">{{ label }}</view>
    <view class="value">{{ value }}</view>
  </view>
</template>

<script>
export default {
  name: "StatCard",
  props: {
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      default: "-"
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.stat-card {
  padding: 12px;
}

.label {
  color: $text-secondary;
  font-size: 12px;
  margin-bottom: 6px;
}

.value {
  color: $text-primary;
  font-size: 28px;
  line-height: 1.2;
  font-weight: 700;
}
</style>
