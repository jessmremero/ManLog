<script>
export default {
  onLaunch() {
    // App launch hook.
  },
};
</script>

<style lang="scss">
@import "@/styles/tokens.scss";

page {
  background-color: $bg-page;
  color: $text-primary;
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    Arial, "Noto Sans", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
}

.page-container {
  min-height: 100vh;
  width: 100%;
  max-width: 390px;
  margin: 0 auto;
  padding: 16px;
  box-sizing: border-box;
}

.page-title {
  font-size: 28px;
  line-height: 1.3;
  font-weight: 700;
  color: $text-primary;
}

.card {
  background: $bg-card;
  border: 1px solid $border;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.06);
}

.chip {
  height: 36px;
  line-height: 36px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid $border;
  color: $text-secondary;
  background: #fff;
  font-size: 14px;
}

.chip.active {
  background: $primary;
  border-color: $primary;
  color: #fff;
}

.primary-button {
  height: 44px;
  line-height: 44px;
  border-radius: 10px;
  background: $primary;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  text-align: center;
}

.muted {
  color: $text-secondary;
}
</style>
