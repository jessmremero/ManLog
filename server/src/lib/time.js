import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import isoWeek from "dayjs/plugin/isoWeek.js";
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

export { dayjs };

/** 将用户选择的本地日历日 + 可选时间转为 UTC 的 MySQL DATETIME 字符串 */
export function localDateTimeToUtcMysql(eventDate, eventTimeOrNull, tz) {
  let wall;
  if (eventTimeOrNull && String(eventTimeOrNull).trim()) {
    wall = String(eventTimeOrNull).trim();
    if (/^\d{1,2}:\d{2}$/.test(wall)) {
      const [a, b] = wall.split(":");
      wall = `${String(a).padStart(2, "0")}:${b}:00`;
    }
  } else {
    wall = dayjs().tz(tz).format("HH:mm:ss");
  }
  const local = dayjs.tz(`${eventDate} ${wall}`, "YYYY-MM-DD HH:mm:ss", tz);
  if (!local.isValid()) throw new Error("INVALID_DATETIME");
  return local.utc().format("YYYY-MM-DD HH:mm:ss");
}
