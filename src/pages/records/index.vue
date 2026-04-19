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
        @click="pickType(item.key)"
      >
        {{ item.label }}
      </view>
    </view>

    <view v-if="showRecordsLoading" class="empty-block card">
      <text class="empty-title">加载中…</text>
    </view>

    <view v-else-if="filteredRecords.length === 0" class="empty-block card">
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
        <view class="record-del-wrap" @click.stop="confirmDeleteRecord(item)">
          <image class="record-del-icon" src="/static/icons/trash.svg" mode="aspectFit" />
        </view>
        <text class="record-arrow">›</text>
      </view>

      <view class="list-footer">
        <text class="footer-line">已显示 {{ filteredRecords.length }} / 共 {{ listFooterTotal }} 条</text>
        <text v-if="listLoadMoreing" class="footer-line footer-muted">正在加载更多…</text>
        <text v-else-if="listNoMore && filteredRecords.length > 0" class="footer-line footer-muted">已加载全部</text>
        <text v-else-if="!listNoMore && filteredRecords.length > 0" class="footer-line footer-muted">上拉加载更多</text>
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
import { useApi } from "@/config/api.js";
import { performWxLogin } from "@/services/authApi.js";
import { deleteRecordApi, fetchRecordList } from "@/services/recordsApi.js";
import { RECORD_TYPES } from "@/static/mock/records";
import { deleteRecord, loadRecords } from "@/utils/recordStore";
import { isLoggedIn, setLoggedIn } from "@/utils/auth";
import { track } from "@/utils/track";

const PAGE_SIZE = 20;

function sortRecordsByDatetimeDesc(list) {
  return [...list].sort((a, b) => {
    const da = String(a.datetime || "").replace(/\//g, "-");
    const db = String(b.datetime || "").replace(/\//g, "-");
    return db.localeCompare(da);
  });
}

export default {
  components: { LoginGatePopup },
  data() {
    return {
      isLoggedIn: false,
      activeType: "ALL",
      typeOptions: RECORD_TYPES,
      records: [],
      mockAllRecords: [],
      listTotal: 0,
      listPage: 1,
      pageSize: PAGE_SIZE,
      listLoading: false,
      listLoadMoreing: false,
      listNoMore: false,
      loginPopupVisible: false,
      pendingLogin: null
    };
  },
  computed: {
    useApiMode() {
      return useApi();
    },
    mockFilteredAll() {
      if (useApi()) return [];
      if (this.activeType === "ALL") return this.mockAllRecords;
      return this.mockAllRecords.filter((item) => item.type === this.activeType);
    },
    filteredRecords() {
      if (useApi()) return this.records;
      return this.mockFilteredAll.slice(0, this.listPage * this.pageSize);
    },
    listFooterTotal() {
      if (useApi()) return this.listTotal;
      return this.mockFilteredAll.length;
    },
    showRecordsLoading() {
      return useApi() && this.isLoggedIn && this.listLoading && this.records.length === 0;
    }
  },
  onShow() {
    this.refreshList();
  },
  onReachBottom() {
    this.tryLoadMore();
  },
  methods: {
    pickType(key) {
      if (this.activeType === key) return;
      this.activeType = key;
      this.listPage = 1;
      this.listNoMore = false;
      if (useApi()) {
        if (!this.isLoggedIn) {
          this.records = [];
          this.listTotal = 0;
          this.listNoMore = true;
          return;
        }
        this.fetchApiRecords({ page: 1, replace: true });
        return;
      }
      this.syncMockNoMore();
    },
    syncMockNoMore() {
      const len = this.mockFilteredAll.length;
      this.listNoMore = len === 0 || this.listPage * this.pageSize >= len;
    },
    tryLoadMore() {
      if (this.listNoMore || this.listLoadMoreing || this.listLoading) return;
      if (useApi()) {
        if (!this.isLoggedIn) return;
        if (this.records.length >= this.listTotal && this.listTotal > 0) {
          this.listNoMore = true;
          return;
        }
        if (this.listTotal === 0) return;
        this.fetchApiRecords({ page: this.listPage + 1, replace: false });
        return;
      }
      this.loadMoreMock();
    },
    loadMoreMock() {
      const fullLen = this.mockFilteredAll.length;
      if (this.listPage * this.pageSize >= fullLen) {
        this.listNoMore = true;
        return;
      }
      this.listPage += 1;
      this.listNoMore = this.listPage * this.pageSize >= fullLen;
    },
    async fetchApiRecords({ page, replace }) {
      if (page === 1) {
        this.listLoading = true;
      } else {
        this.listLoadMoreing = true;
      }
      try {
        const res = await fetchRecordList({
          page,
          pageSize: this.pageSize,
          eventType: this.activeType === "ALL" ? undefined : this.activeType
        });
        if (replace || page === 1) {
          this.records = res.list;
        } else {
          this.records = [...this.records, ...res.list];
        }
        this.listPage = page;
        this.listTotal = res.total;
        this.listNoMore = this.records.length >= this.listTotal;
      } catch (e) {
        if (page === 1) {
          this.records = [];
          this.listTotal = 0;
        }
        uni.showToast({ title: e.message || "加载失败", icon: "none" });
      } finally {
        this.listLoading = false;
        this.listLoadMoreing = false;
      }
    },
    async refreshList() {
      this.isLoggedIn = isLoggedIn();
      this.listPage = 1;
      this.listNoMore = false;
      if (useApi()) {
        this.mockAllRecords = [];
        if (!this.isLoggedIn) {
          this.records = [];
          this.listTotal = 0;
          this.listLoading = false;
          this.listNoMore = true;
          return;
        }
        await this.fetchApiRecords({ page: 1, replace: true });
        return;
      }
      this.records = [];
      this.mockAllRecords = sortRecordsByDatetimeDesc(loadRecords());
      this.syncMockNoMore();
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
    async confirmLoginPopup() {
      if (useApi()) {
        uni.showLoading({ title: "登录中", mask: true });
        try {
          await performWxLogin();
          this.isLoggedIn = true;
          this.loginPopupVisible = false;
          const p = this.pendingLogin;
          this.pendingLogin = null;
          track("login_success", { via: "popup" });
          await this.refreshList();
          if (p === "create") this.openFormCreate();
          else if (p && p.kind === "edit") this.openFormEdit(p.item);
          else if (p && p.kind === "delete") {
            setTimeout(() => this.confirmDeleteRecord(p.item), 250);
          }
        } catch (e) {
          uni.showToast({ title: e.message || "登录失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
        return;
      }
      setLoggedIn(true);
      this.isLoggedIn = true;
      this.loginPopupVisible = false;
      const p = this.pendingLogin;
      this.pendingLogin = null;
      track("login_success", { via: "popup" });
      if (p === "create") this.openFormCreate();
      else if (p && p.kind === "edit") this.openFormEdit(p.item);
      else if (p && p.kind === "delete") {
        setTimeout(() => this.confirmDeleteRecord(p.item), 250);
      }
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
    confirmDeleteRecord(item) {
      if (!this.isLoggedIn) {
        this.pendingLogin = { kind: "delete", item };
        this.loginPopupVisible = true;
        return;
      }
      uni.showModal({
        title: "删除确认",
        content: "确定删除这条记录？删除后无法恢复。",
        confirmText: "确认",
        cancelText: "取消",
        success: (res) => {
          if (!res.confirm) return;
          this.doDeleteRecord(item);
        }
      });
    },
    async doDeleteRecord(item) {
      const id = Number(item.id);
      if (!Number.isFinite(id)) {
        uni.showToast({ title: "无效记录", icon: "none" });
        return;
      }
      if (useApi()) {
        uni.showLoading({ title: "删除中", mask: true });
        try {
          await deleteRecordApi(id);
          track("record_delete", { id, from: "list" });
          uni.showToast({ title: "已删除", icon: "success" });
          await this.refreshList();
        } catch (e) {
          uni.showToast({ title: e.message || "删除失败", icon: "none" });
        } finally {
          uni.hideLoading();
        }
        return;
      }
      deleteRecord(loadRecords(), id);
      track("record_delete", { id, from: "list" });
      uni.showToast({ title: "已删除", icon: "success" });
      await this.refreshList();
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

.record-del-wrap {
  flex-shrink: 0;
  padding: 6px 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.record-del-icon {
  width: 22px;
  height: 22px;
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
