import type { Locale } from "../options/schema.js";
import { en } from "./en.js";
import { ko } from "./ko.js";
import type { Messages } from "./messages.js";

const catalog: Record<Locale, Messages> = { en, ko };

export function messagesFor(locale: Locale): Messages {
  return catalog[locale];
}

export type { Messages };
