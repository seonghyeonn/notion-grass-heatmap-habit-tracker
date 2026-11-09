import type { Messages } from "./messages.js";

const plural = (n: number, word: string) => `${n.toLocaleString("en-US")} ${word}${n === 1 ? "" : "s"}`;
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const en: Messages = {
  defaultTitle: "Activity",
  months: MONTHS,
  weekdays: WEEKDAYS,
  less: "Less",
  more: "More",
  streak: (days) => ({ value: days.toLocaleString("en-US"), label: "day streak", joiner: " " }),
  summary: (stats, weeks) =>
    `${plural(stats.activeDays, "active day")} in ${weeks === 53 ? "the last year" : plural(weeks, "week")} · longest ${plural(stats.longestStreak, "day")}`,
  cellValue: (value, mode) => {
    if (mode.kind === "presence") return value > 0 ? "Done" : "No activity";
    if (mode.kind === "count") return value > 0 ? plural(value, "item") : "No activity";
    if (mode.kind === "checkbox") return value > 0 ? `${plural(value, "check")}` : "Not checked";
    return value > 0 ? `${value.toLocaleString("en-US")} ${mode.property}` : "No activity";
  },
  formatDate: (year, month, day, weekday) => `${WEEKDAYS[weekday]}, ${MONTHS[month - 1]} ${day}, ${year}`,
  errorTitle: "Could not draw the heatmap",
  themePicker: { button: "Change theme", heading: "Theme", reset: "Default" },
};
