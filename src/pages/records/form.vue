<template>
  <view class="page-container">
    <view class="card form-card">
      <view class="field">
        <view class="label">日期 *</view>
        <input class="input" v-model="form.date" />
      </view>

      <view class="field">
        <view class="label-row">
          <text class="label">时间</text>
          <text class="hint">默认当前时间，可修改</text>
        </view>
        <input class="input" v-model="form.time" />
      </view>

      <view class="field">
        <view class="label">事件类型 *</view>
        <view class="chips">
          <view
            v-for="item in typeOptions"
            :key="item.key"
            class="chip"
            :class="{ active: form.type === item.key }"
            @click="form.type = item.key"
          >
            {{ item.label }}
          </view>
        </view>
      </view>

      <view class="field">
        <view class="label-row">
          <text class="label">备注</text>
          <text class="hint">{{ form.note.length }}/200</text>
        </view>
        <textarea class="textarea" maxlength="200" v-model="form.note" placeholder="记录一些细节..." />
      </view>
    </view>

    <view class="primary-button" @click="save">保存</view>
    <view v-if="mode === 'edit'" class="delete-btn" @click="remove">删除</view>
  </view>
</template>

<script>
import { RECORD_TYPES } from "@/static/mock/records";

export default {
  data() {
    return {
      mode: "create",
      typeOptions: RECORD_TYPES.filter((x) => x.key !== "ALL"),
      form: {
        date: "2026/04/09",
        time: "",
        type: "EMISSION",
        note: ""
      }
    };
  },
  onLoad(query) {
    this.mode = query.mode || "create";
    if (this.mode === "create") {
      this.form.time = this.nowTime();
      uni.setNavigationBarTitle({ title: "新增记录" });
    } else {
      this.form.time = "20:21";
      this.form.note = "晚上休息一般";
      this.form.type = "MASTURBATION";
      uni.setNavigationBarTitle({ title: "编辑记录" });
    }
  },
  methods: {
    nowTime() {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
    save() {
      uni.showToast({ title: "静态页面：已保存", icon: "none" });
      setTimeout(() => uni.navigateBack(), 500);
    },
    remove() {
      uni.showModal({
        title: "删除确认",
        content: "确认删除这条记录？",
        success: (res) => {
          if (res.confirm) {
            uni.showToast({ title: "静态页面：已删除", icon: "none" });
            setTimeout(() => uni.navigateBack(), 500);
          }
        }
      });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.form-card {
  padding: 14px;
  margin-bottom: 16px;
}

.field {
  margin-bottom: 14px;
}

.label {
  font-weight: 600;
  margin-bottom: 8px;
  display: inline-block;
}

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  color: $text-secondary;
}

.input {
  height: 44px;
  border-radius: 10px;
  border: 1px solid $border;
  background: #fff;
  padding: 0 12px;
}

.textarea {
  width: 100%;
  min-height: 120px;
  border-radius: 10px;
  border: 1px solid $border;
  background: #fff;
  padding: 10px 12px;
  box-sizing: border-box;
}

.chips {
  display: flex;
  gap: 8px;
}

.delete-btn {
  margin-top: 10px;
  text-align: center;
  color: #ef4444;
  height: 44px;
  line-height: 44px;
  background: #fee2e2;
  border-radius: 10px;
}
</style>
