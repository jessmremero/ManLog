<template>
  <view class="page-container">
    <view class="header-row">
      <text class="page-title page-title--records">历史记录</text>
      <view class="primary-button add-btn" @click="handleCreate">+ 新增</view>
    </view>

    <view class="chips">
      <view
        v-for="item in typeOptions"
        :key="item.key"
        class="chip"
        :class="{ active: activeType === item.key }"
        @click="activeType = item.key"
      >
        {{ item.label }}
      </view>
    </view>

    <view v-for="item in filteredRecords" :key="item.id" class="record-card card" @click="handleEdit(item)">
      <view class="record-indicator" :class="indicatorClass(item.type)"></view>
      <view class="record-content">
        <view class="record-top">
          <text class="type-tag" :class="typeTagClass(item.type)">{{ item.typeLabel }}</text>
          <text class="muted time-text">{{ item.datetime }}</text>
        </view>
        <view class="record-note">{{ item.note || "无备注" }}</view>
      </view>
      <text class="record-arrow">›</text>
    </view>
  </view>
</template>

<script>
import { RECORD_TYPES, MOCK_RECORDS } from "@/static/mock/records";
import { isLoggedIn } from "@/utils/auth";

export default {
  data() {
    return {
      isLoggedIn: false,
      activeType: "ALL",
      typeOptions: RECORD_TYPES,
      records: MOCK_RECORDS
    };
  },
  onShow() {
    this.isLoggedIn = isLoggedIn();
  },
  computed: {
    filteredRecords() {
      if (this.activeType === "ALL") return this.records;
      return this.records.filter((item) => item.type === this.activeType);
    }
  },
  methods: {
    indicatorClass(type) {
      if (type === "SEX") return "indicator-sex";
      if (type === "MASTURBATION") return "indicator-relief";
      return "indicator-physio";
    },
    typeTagClass(type) {
      if (type === "SEX") return "type-tag-sex";
      if (type === "MASTURBATION") return "type-tag-relief";
      return "type-tag-physio";
    },
    handleCreate() {
      if (!this.isLoggedIn) {
        uni.navigateTo({ url: "/pages/auth/login" });
        return;
      }
      uni.navigateTo({ url: "/pages/records/form?mode=create" });
    },
    handleEdit(item) {
      if (!this.isLoggedIn) {
        uni.navigateTo({ url: "/pages/auth/login" });
        return;
      }
      uni.navigateTo({ url: `/pages/records/form?mode=edit&id=${item.id}` });
    }
  }
};
</script>

<style lang="scss" scoped>
@import "@/styles/tokens.scss";

.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-title--records {
  font-size: 36px;
  font-weight: 800;
  line-height: 1.2;
}

.add-btn {
  width: 92px;
  height: 40px;
  line-height: 40px;
  border-radius: 12px;
  font-size: 15px;
  box-shadow: 0 6px 14px rgba(79, 70, 229, 0.24);
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}

.record-card {
  padding: 14px 12px;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.record-indicator {
  width: 3px;
  height: 42px;
  border-radius: 999px;
  flex-shrink: 0;
}

.indicator-physio {
  background: #6366f1;
}

.indicator-sex {
  background: #0ea5a4;
}

.indicator-relief {
  background: #8b5cf6;
}

.record-content {
  flex: 1;
  min-width: 0;
}

.record-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.type-tag {
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 12px;
  line-height: 1;
  border: 1px solid transparent;
}

.type-tag-physio {
  background: #4f46e5;
  color: #ffffff;
  border-color: #4f46e5;
}

.type-tag-sex {
  background: #0ea5a4;
  color: #ffffff;
  border-color: #0ea5a4;
}

.type-tag-relief {
  background: #8b5cf6;
  color: #ffffff;
  border-color: #8b5cf6;
}

.time-text {
  font-size: 14px;
}

.record-note {
  font-size: 14px;
  color: #374151;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-arrow {
  color: #9ca3af;
  font-size: 22px;
  line-height: 1;
}
</style>
