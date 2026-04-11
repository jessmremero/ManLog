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

    <view v-if="filteredRecords.length === 0" class="empty-block card">
      <text class="empty-title">暂无记录</text>
      <text class="empty-desc">
        {{ activeType === "ALL" ? "登录后新增一条，或调整筛选类型。" : "该类型下还没有记录，试试「全部」或其他类型。" }}
      </text>
      <view v-if="isLoggedIn" class="empty-action primary-button" @click="handleCreate">去新增</view>
    </view>

    <template v-else>
      <view
        v-for="item in filteredRecords"
        :key="item.id"
        class="record-card card"
        @click="handleEdit(item)"
      >
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

      <view class="list-footer">
        <text class="footer-line">已显示 {{ filteredRecords.length }} 条</text>
        <text class="footer-line footer-muted">分页与上拉加载将在接入接口后启用</text>
      </view>
    </template>

    <LoginGatePopup
      :visible="loginPopupVisible"
      @close="closeLoginPopup"
      @login="confirmLoginPopup"
    />
  </view>
</template>

<script>
import LoginGatePopup from "@/components/LoginGatePopup.vue";
import { RECORD_TYPES } from "@/static/mock/records";
import { loadRecords } from "@/utils/recordStore";
import { isLoggedIn, setLoggedIn } from "@/utils/auth";
import { track } from "@/utils/track";

export default {
  components: { LoginGatePopup },
  data() {
    return {
      isLoggedIn: false,
      activeType: "ALL",
      typeOptions: RECORD_TYPES,
      records: [],
      loginPopupVisible: false,
      pendingLogin: null
    };
  },
  computed: {
    filteredRecords() {
      if (this.activeType === "ALL") return this.records;
      return this.records.filter((item) => item.type === this.activeType);
    }
  },
  onShow() {
    this.isLoggedIn = isLoggedIn();
    this.records = loadRecords();
  },
  methods: {
    refreshList() {
      this.records = loadRecords();
    },
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
    closeLoginPopup() {
      this.loginPopupVisible = false;
      this.pendingLogin = null;
    },
    confirmLoginPopup() {
      setLoggedIn(true);
      this.isLoggedIn = true;
      this.loginPopupVisible = false;
      const p = this.pendingLogin;
      this.pendingLogin = null;
      track("login_success", { via: "popup" });
      if (p === "create") this.openFormCreate();
      else if (p && p.kind === "edit") this.openFormEdit(p.item);
    },
    handleCreate() {
      if (!this.isLoggedIn) {
        this.pendingLogin = "create";
        this.loginPopupVisible = true;
        return;
      }
      this.openFormCreate();
    },
    handleEdit(item) {
      if (!this.isLoggedIn) {
        this.pendingLogin = { kind: "edit", item };
        this.loginPopupVisible = true;
        return;
      }
      this.openFormEdit(item);
    },
    openFormCreate() {
      uni.navigateTo({
        url: "/pages/records/form?mode=create",
        success: (res) => {
          res.eventChannel.on("recordsChanged", () => {
            this.refreshList();
          });
        }
      });
    },
    openFormEdit(item) {
      uni.navigateTo({
        url: `/pages/records/form?mode=edit&id=${item.id}`,
        success: (res) => {
          res.eventChannel.on("recordsChanged", () => {
            this.refreshList();
          });
        }
      });
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

.empty-block {
  padding: 32px 20px 28px;
  text-align: center;
  margin-top: 8px;
}

.empty-title {
  display: block;
  font-size: 16px;
  font-weight: 600;
  color: $text-primary;
  margin-bottom: 8px;
}

.empty-desc {
  display: block;
  font-size: 13px;
  color: $text-secondary;
  line-height: 1.55;
  margin-bottom: 16px;
}

.empty-action {
  display: inline-block;
  min-width: 120px;
  margin: 0 auto;
}

.list-footer {
  padding: 16px 8px 24px;
  text-align: center;
}

.footer-line {
  display: block;
  font-size: 12px;
  color: $text-secondary;
  line-height: 1.6;
}

.footer-muted {
  color: $text-placeholder;
}
</style>
