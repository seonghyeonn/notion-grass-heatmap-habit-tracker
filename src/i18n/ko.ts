import type { Messages } from "./messages.js";

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const num = (n: number) => n.toLocaleString("ko-KR");

export const ko: Messages = {
  defaultTitle: "활동 기록",
  months: Array.from({ length: 12 }, (_, i) => `${i + 1}월`),
  weekdays: WEEKDAYS,
  less: "적음",
  more: "많음",
  streak: (days) => ({ value: num(days), label: "일 연속", joiner: "" }),
  summary: (stats, weeks) =>
    `${weeks === 53 ? "최근 1년" : `최근 ${num(weeks)}주`} ${num(stats.activeDays)}일 기록 · 최장 ${num(stats.longestStreak)}일`,
  cellValue: (value, mode) => {
    if (mode.kind === "presence") return value > 0 ? "기록 있음" : "기록 없음";
    if (mode.kind === "count") return value > 0 ? `${num(value)}건` : "기록 없음";
    if (mode.kind === "checkbox") return value > 0 ? `완료 ${num(value)}건` : "미완료";
    return value > 0 ? `${mode.property} ${num(value)}` : "기록 없음";
  },
  formatDate: (year, month, day, weekday) => `${year}년 ${month}월 ${day}일 (${WEEKDAYS[weekday]})`,
  errorTitle: "잔디를 그리지 못했어요",
};
