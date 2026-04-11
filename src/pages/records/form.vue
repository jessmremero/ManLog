<template>
  <view class="page-container">
    <view class="card form-card">
      <view class="field">
        <view class="label">日期 *</view>
        <input
          class="input"
          :class="{ 'input--error': fieldErrors.date }"
          v-model="form.date"
          placeholder="例如 2026/04/11"
          @input="clearError('date')"
        />
        <text v-if="fieldErrors.date" class="field-error">{{ fieldErrors.date }}</text>
      </view>

      <view class="field">
        <view class="label-row">
          <text class="label">时间</text>
          <text class="hint">留空则使用当前时间；填写须为 24 小时制</text>
        </view>
        <input
          class="input"
          :class="{ 'input--error': fieldErrors.time }"
          v-model="form.time"
          placeholder="例如 21:30，可留空"
          @input="clearError('time')"
        />
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
  </view>
</template>

<script>
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
      }
    };
  },
  onLoad(query) {
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
    } else {
      this.editId = query.id ? Number(query.id) : null;
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
    }
  },
  methods: {
    todayStr() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}/${m}/${day}`;
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
    save() {
      if (!this.validate()) {
        toastInfo("请修正表单标红项");
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
        content: "确认删除这条记录？",
        success: (res) => {
          if (!res.confirm) return;
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
</style>
