<template>
  <view class="page-container">
    <view class="card form-card">
      <view class="field">
        <view class="label">日期 *</view>
        <view class="input picker-mimic" :class="{ 'input--error': fieldErrors.date }" @click="openDatePanel">
          {{ form.date || "请选择日期" }}
        </view>
        <text v-if="fieldErrors.date" class="field-error">{{ fieldErrors.date }}</text>
      </view>

      <view class="field">
        <view class="label-row">
          <text class="label">时间</text>
          <text class="hint">默认当前时间，可修改</text>
        </view>
        <view class="input picker-mimic" :class="{ 'input--error': fieldErrors.time }" @click="openTimePanel">
          {{ timeFieldLabel }}
        </view>
        <text v-if="fieldErrors.time" class="field-error">{{ fieldErrors.time }}</text>
      </view>

      <view class="field">
        <view class="label">事件类型 *</view>
        <view class="chips">
          <view
            v-for="item in typeOptions"
            :key="item.key"
            class="chip"
            :class="{ active: form.type === item.key }"
            @click="onPickType(item.key)"
          >
            {{ item.label }}
          </view>
        </view>
        <text v-if="fieldErrors.type" class="field-error">{{ fieldErrors.type }}</text>
      </view>

      <view class="field">
        <view class="label-row">
          <text class="label">备注</text>
          <text class="hint">{{ form.note.length }}/200</text>
        </view>
        <textarea
          class="textarea"
          :class="{ 'input--error': fieldErrors.note }"
          maxlength="200"
          v-model="form.note"
          placeholder="记录一些细节..."
          @input="clearError('note')"
        />
        <text v-if="fieldErrors.note" class="field-error">{{ fieldErrors.note }}</text>
      </view>
    </view>

    <view class="primary-button" @click="save">保存</view>
    <view v-if="mode === 'edit'" class="delete-btn" @click="remove">删除</view>

    <!-- 自定义日期/时间选择（H5 原生 picker 常为英文；此处全中文） -->
    <view v-if="showDatePanel" class="picker-overlay" @click.self="closeDatePanel">
      <view class="picker-sheet" @click.stop>
        <view class="picker-toolbar">
          <text class="picker-toolbar-btn" @click="closeDatePanel">取消</text>
          <text class="picker-toolbar-btn picker-toolbar-btn--primary" @click="confirmDatePanel">确认</text>
        </view>
        <picker-view
          class="picker-view-box"
          :value="datePickerInner"
          indicator-style="height: 44px;"
          @change="onDatePickerViewChange"
        >
          <picker-view-column>
            <view v-for="y in yearList" :key="'y' + y" class="picker-item">{{ y }}年</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="mo in monthList" :key="'m' + mo" class="picker-item">{{ mo }}月</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="day in dayList" :key="'d' + day" class="picker-item">{{ day }}日</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>

    <view v-if="showTimePanel" class="picker-overlay" @click.self="closeTimePanel">
      <view class="picker-sheet" @click.stop>
        <view class="picker-toolbar">
          <text class="picker-toolbar-btn" @click="closeTimePanel">取消</text>
          <text class="picker-toolbar-btn picker-toolbar-btn--primary" @click="confirmTimePanel">确认</text>
        </view>
        <picker-view
          class="picker-view-box"
          :value="timePickerInner"
          indicator-style="height: 44px;"
          @change="onTimePickerViewChange"
        >
          <picker-view-column>
            <view v-for="h in hourList" :key="'h' + h" class="picker-item">{{ pad2(h) }}时</view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="m in minuteList" :key="'mi' + m" class="picker-item">{{ pad2(m) }}分</view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script>
import { useApi } from "@/config/api.js";
import {
  createRecordApi,
  deleteRecordApi,
  fetchRecord,
  updateRecordApi
} from "@/services/recordsApi.js";
import { RECORD_TYPES } from "@/static/mock/records";
import {
  addRecord,
  deleteRecord,
  findRecord,
  formatDisplayNote,
  getTypeLabel,
  loadRecords,
  normalizeDateForStore,
  nextId,
  updateRecord
} from "@/utils/recordStore";
import { runWithLoading, toastError, toastInfo, toastSuccess } from "@/utils/ui";
import { track } from "@/utils/track";

export default {
  data() {
    return {
      mode: "create",
      editId: null,
      openerChannel: null,
      typeOptions: RECORD_TYPES.filter((x) => x.key !== "ALL"),
      fieldErrors: {
        date: "",
        time: "",
        type: "",
        note: ""
      },
      form: {
        date: "",
        time: "",
        type: "EMISSION",
        note: ""
      },
      showDatePanel: false,
      showTimePanel: false,
      datePickerInner: [0, 0, 0],
      timePickerInner: [0, 0]
    };
  },
  computed: {
    yearList() {
      const y = new Date().getFullYear();
      const start = y - 30;
      const end = y + 15;
      const a = [];
      for (let i = start; i <= end; i += 1) a.push(i);
      return a;
    },
    monthList() {
      return Array.from({ length: 12 }, (_, i) => i + 1);
    },
    dayList() {
      const [yi, mi] = this.datePickerInner;
      const y = this.yearList[yi] ?? new Date().getFullYear();
      const month = (mi ?? 0) + 1;
      const n = this.daysInMonth(y, month);
      return Array.from({ length: n }, (_, i) => i + 1);
    },
    hourList() {
      return Array.from({ length: 24 }, (_, i) => i);
    },
    minuteList() {
      return Array.from({ length: 60 }, (_, i) => i);
    },
    timeFieldLabel() {
      const s = (this.form.time || "").trim();
      return s || this.nowTime();
    }
  },
  async onLoad(query) {
    if (typeof this.getOpenerEventChannel === "function") {
      this.openerChannel = this.getOpenerEventChannel();
    }
    this.mode = query.mode || "create";
    if (this.mode === "create") {
      this.form.date = this.todayStr();
      this.form.time = this.nowTime();
      this.form.type = "EMISSION";
      this.form.note = "";
      uni.setNavigationBarTitle({ title: "新增记录" });
      return;
    }

    this.editId = query.id ? Number(query.id) : null;
    if (!Number.isFinite(this.editId)) {
      toastError("无效的记录");
      setTimeout(() => uni.navigateBack(), 400);
      return;
    }

    if (useApi()) {
      await this.loadEditFromApi();
      return;
    }

    const list = loadRecords();
    const row = findRecord(list, this.editId);
    if (!row) {
      toastError("记录不存在或已删除");
      setTimeout(() => uni.navigateBack(), 400);
      return;
    }
    const [dPart, tPart] = (row.datetime || "").split(" ");
    this.form.date = dPart ? dPart.replace(/-/g, "/") : this.todayStr();
    this.form.time = tPart || this.nowTime();
    this.form.type = row.type;
    this.form.note = row.note === "无备注" ? "" : row.note || "";
    uni.setNavigationBarTitle({ title: "编辑记录" });
  },
  methods: {
    todayIsoYmd() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },
    todayStr() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}/${m}/${day}`;
    },
    daysInMonth(year, month) {
      return new Date(year, month, 0).getDate();
    },
    pad2(n) {
      return String(n).padStart(2, "0");
    },
    syncDateInnerFromForm() {
      const m = (this.form.date || "").trim().match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      let y;
      let mo;
      let d;
      if (m) {
        y = Number(m[1]);
        mo = Number(m[2]);
        d = Number(m[3]);
      } else {
        const t = new Date();
        y = t.getFullYear();
        mo = t.getMonth() + 1;
        d = t.getDate();
      }
      let yi = this.yearList.indexOf(y);
      if (yi < 0) yi = this.yearList.length - 1;
      const mi = Math.min(11, Math.max(0, mo - 1));
      const maxD = this.daysInMonth(this.yearList[yi], mi + 1);
      const di = Math.min(maxD - 1, Math.max(0, d - 1));
      this.datePickerInner = [yi, mi, di];
    },
    openDatePanel() {
      this.syncDateInnerFromForm();
      this.showDatePanel = true;
    },
    closeDatePanel() {
      this.showDatePanel = false;
    },
    onDatePickerViewChange(e) {
      const v = e.detail.value;
      let yi = v[0];
      let mi = v[1];
      let di = v[2];
      const y = this.yearList[yi];
      const month = mi + 1;
      const maxD = this.daysInMonth(y, month);
      if (di >= maxD) di = maxD - 1;
      this.datePickerInner = [yi, mi, di];
    },
    confirmDatePanel() {
      const [yi, mi, di] = this.datePickerInner;
      const y = this.yearList[yi];
      const month = mi + 1;
      const day = di + 1;
      this.form.date = `${y}/${this.pad2(month)}/${this.pad2(day)}`;
      this.showDatePanel = false;
      this.clearError("date");
    },
    openTimePanel() {
      const s = (this.form.time || "").trim() || this.nowTime();
      const m = s.match(/^(\d{1,2}):(\d{2})$/);
      const h = m ? Math.min(23, Math.max(0, Number(m[1]))) : 0;
      const min = m ? Math.min(59, Math.max(0, Number(m[2]))) : 0;
      this.timePickerInner = [h, min];
      this.showTimePanel = true;
    },
    closeTimePanel() {
      this.showTimePanel = false;
    },
    onTimePickerViewChange(e) {
      const v = e.detail.value;
      this.timePickerInner = [v[0], v[1]];
    },
    confirmTimePanel() {
      const [h, min] = this.timePickerInner;
      this.form.time = `${this.pad2(h)}:${this.pad2(min)}`;
      this.showTimePanel = false;
      this.clearError("time");
    },
    nowTime() {
      const d = new Date();
      return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    },
    clearError(key) {
      if (this.fieldErrors[key]) this.fieldErrors[key] = "";
    },
    onPickType(key) {
      this.form.type = key;
      this.clearError("type");
    },
    validate() {
      const err = { date: "", time: "", type: "", note: "" };
      const dateStr = (this.form.date || "").trim();
      if (!dateStr) err.date = "请填写日期";
      else if (!this.isValidDateStr(dateStr)) err.date = "日期格式为 YYYY/MM/DD，且须为有效日期";

      const timeStr = (this.form.time || "").trim();
      if (timeStr && !this.isValidTimeStr(timeStr)) err.time = "时间须为 HH:mm（24 小时制）";

      const types = this.typeOptions.map((x) => x.key);
      if (!types.includes(this.form.type)) err.type = "请选择事件类型";

      const note = this.form.note || "";
      if (note.length > 200) err.note = "备注不能超过 200 字";

      this.fieldErrors = err;
      return !err.date && !err.time && !err.type && !err.note;
    },
    isValidDateStr(s) {
      const m = s.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/);
      if (!m) return false;
      const y = Number(m[1]);
      const mo = Number(m[2]);
      const d = Number(m[3]);
      if (mo < 1 || mo > 12 || d < 1 || d > 31) return false;
      const dt = new Date(y, mo - 1, d);
      return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
    },
    isValidTimeStr(s) {
      const m = s.match(/^(\d{1,2}):(\d{2})$/);
      if (!m) return false;
      const h = Number(m[1]);
      const min = Number(m[2]);
      return h >= 0 && h <= 23 && min >= 0 && min <= 59;
    },
    async loadEditFromApi() {
      uni.showLoading({ title: "加载中", mask: true });
      try {
        const row = await fetchRecord(this.editId);
        const d = row.eventDate || (row.datetime || "").split(" ")[0] || "";
        this.form.date = d ? d.replace(/-/g, "/") : this.todayStr();
        let t = "";
        if (row.eventTime) {
          const s = String(row.eventTime).trim();
          t = s.length >= 5 ? s.slice(0, 5) : s;
        } else {
          const parts = (row.datetime || "").split(" ");
          t = parts[1] ? parts[1].slice(0, 5) : "";
        }
        this.form.time = t || this.nowTime();
        this.form.type = row.eventType || row.type;
        this.form.note = (row.note || "").trim();
        uni.setNavigationBarTitle({ title: "编辑记录" });
      } catch (e) {
        toastError(e.message || "记录不存在或已删除");
        setTimeout(() => uni.navigateBack(), 400);
      } finally {
        uni.hideLoading();
      }
    },
    buildApiBody() {
      const eventDate = normalizeDateForStore(this.form.date);
      const timePart = (this.form.time || "").trim();
      const body = {
        eventType: this.form.type,
        eventDate,
        note: (this.form.note || "").trim().slice(0, 200)
      };
      if (timePart) body.eventTime = timePart;
      return body;
    },
    save() {
      if (!this.validate()) {
        toastInfo("请修正表单标红项");
        return;
      }
      if (useApi()) {
        runWithLoading(
          async () => {
            const body = this.buildApiBody();
            if (this.mode === "create") {
              await createRecordApi(body);
            } else {
              await updateRecordApi(this.editId, body);
            }
            track("record_save", { mode: this.mode });
          },
          { title: "保存中" }
        )
          .then(() => {
            toastSuccess("已保存");
            if (this.openerChannel && typeof this.openerChannel.emit === "function") {
              this.openerChannel.emit("recordsChanged", { source: "form" });
            }
            setTimeout(() => uni.navigateBack(), 450);
          })
          .catch(() => {});
        return;
      }

      runWithLoading(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              const list = loadRecords();
              const dateStore = normalizeDateForStore(this.form.date);
              let timePart = (this.form.time || "").trim();
              if (!timePart) {
                const d = new Date();
                timePart = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
              }
              const datetime = `${dateStore} ${timePart}`;
              const note = formatDisplayNote(this.form.note);
              if (this.mode === "create") {
                const row = {
                  id: nextId(list),
                  type: this.form.type,
                  typeLabel: getTypeLabel(this.form.type),
                  datetime,
                  note
                };
                addRecord(list, row);
              } else {
                updateRecord(list, this.editId, {
                  type: this.form.type,
                  typeLabel: getTypeLabel(this.form.type),
                  datetime,
                  note
                });
              }
              track("record_save", { mode: this.mode });
              resolve();
            }, 160);
          }),
        { title: "保存中" }
      )
        .then(() => {
          toastSuccess("已保存");
          if (this.openerChannel && typeof this.openerChannel.emit === "function") {
            this.openerChannel.emit("recordsChanged", { source: "form" });
          }
          setTimeout(() => uni.navigateBack(), 450);
        })
        .catch(() => {});
    },
    remove() {
      uni.showModal({
        title: "删除确认",
        content: "确认删除这条记录？删除后无法恢复。",
        confirmText: "确认",
        cancelText: "取消",
        success: (res) => {
          if (!res.confirm) return;
          if (useApi()) {
            runWithLoading(
              async () => {
                await deleteRecordApi(this.editId);
                track("record_delete", { id: this.editId });
              },
              { title: "删除中" }
            )
              .then(() => {
                toastSuccess("已删除");
                if (this.openerChannel && typeof this.openerChannel.emit === "function") {
                  this.openerChannel.emit("recordsChanged", { source: "form" });
                }
                setTimeout(() => uni.navigateBack(), 450);
              })
              .catch(() => {});
            return;
          }
          runWithLoading(
            () =>
              new Promise((resolve) => {
                setTimeout(() => {
                  deleteRecord(loadRecords(), this.editId);
                  track("record_delete", { id: this.editId });
                  resolve();
                }, 160);
              }),
            { title: "删除中" }
          )
            .then(() => {
              toastSuccess("已删除");
              if (this.openerChannel && typeof this.openerChannel.emit === "function") {
                this.openerChannel.emit("recordsChanged", { source: "form" });
              }
              setTimeout(() => uni.navigateBack(), 450);
            })
            .catch(() => {});
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

.picker-mimic {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  width: 100%;
  line-height: 44px;
}

.input--error {
  border-color: #f87171;
  background: #fef2f2;
}

.field-error {
  display: block;
  font-size: 12px;
  color: #dc2626;
  margin-top: 6px;
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

.picker-overlay {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(15, 23, 42, 0.45);
  z-index: 1000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.picker-sheet {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border-radius: 16px 16px 0 0;
  padding-bottom: env(safe-area-inset-bottom, 12px);
}

.picker-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid $border;
}

.picker-toolbar-btn {
  font-size: 16px;
  color: $text-secondary;
  padding: 4px 8px;
}

.picker-toolbar-btn--primary {
  color: #4f46e5;
  font-weight: 600;
}

.picker-view-box {
  width: 100%;
  height: 220px;
}

.picker-item {
  line-height: 44px;
  text-align: center;
  font-size: 16px;
  color: $text-primary;
}
</style>
