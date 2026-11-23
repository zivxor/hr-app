/*
 * validation.ts
 * Shared server-side input checks used by every route file.
 * The browser validates too, but requests can bypass the UI (curl, Postman),
 * so the server never trusts the client. Each route declares its fields as a
 * set of rules, and validate() returns clean values ready for ? placeholders.
 */
import { ValidationError } from "./errors.js";

type BaseRule = { label: string; required?: boolean };
type TextRule = BaseRule & { type: "text"; maxLength: number; oneOf?: readonly string[]; email?: boolean };
type NumberRule = BaseRule & { type: "int" | "decimal"; min?: number; max?: number };
type DateRule = BaseRule & { type: "date" };
export type Rule = TextRule | NumberRule | DateRule;
export type Rules = Record<string, Rule>;
type CleanValue = string | number | null;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const DECIMAL_PATTERN = /^-?\d+(\.\d{1,2})?$/; // matches DECIMAL(x,2) columns: at most 2 decimals
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// True only for real calendar dates in YYYY-MM-DD form (rejects 2025-02-30)
export function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

// Checks one value against its rule. Returns the cleaned value, or an error message.
function checkField(raw: unknown, rule: Rule): { value: CleanValue } | { error: string } {
  // Empty input becomes NULL, which lets optional columns (e.g. PROJECT.end_date) be cleared
  const text = raw === undefined || raw === null ? "" : String(raw).trim();
  if (text === "") {
    return rule.required ? { error: `${rule.label} is required.` } : { value: null };
  }

  switch (rule.type) {
    case "text":
      if (text.length > rule.maxLength) return { error: `${rule.label} must be at most ${rule.maxLength} characters.` };
      if (rule.email && !EMAIL_PATTERN.test(text)) return { error: `${rule.label} must be a valid email address.` };
      if (rule.oneOf && !rule.oneOf.includes(text)) return { error: `${rule.label} must be one of: ${rule.oneOf.join(", ")}.` };
      return { value: text };

    case "int":
    case "decimal": {
      const valid = rule.type === "int" ? /^-?\d+$/.test(text) : DECIMAL_PATTERN.test(text);
      if (!valid) {
        return { error: `${rule.label} must be ${rule.type === "int" ? "a whole number" : "a number with at most 2 decimals"}.` };
      }
      const num = Number(text);
      if (rule.min !== undefined && num < rule.min) return { error: `${rule.label} must be at least ${rule.min}.` };
      if (rule.max !== undefined && num > rule.max) return { error: `${rule.label} must be at most ${rule.max}.` };
      return { value: num };
    }

    case "date":
      if (!isValidDate(text)) return { error: `${rule.label} must be a valid date (YYYY-MM-DD).` };
      return { value: text };
  }
}

// Cross-field rule: the `end` date may not come before the `start` date
export type DateOrder = { start: string; end: string; message: string };

// Validates every field in `rules`, then each date-order rule, and throws one
// ValidationError listing all problems, so the user can fix everything in a single
// pass instead of one error at a time.
// The result is typed with exactly the keys of `rules` (routes declare them with
// `satisfies Rules`), so a misspelled column name is a compile-time error.
export function validate<R extends Rules>(
  body: unknown,
  rules: R,
  dateOrders: DateOrder[] = []
): Record<keyof R, CleanValue> {
  const input = (typeof body === "object" && body !== null ? body : {}) as Record<string, unknown>;
  const row: Record<string, CleanValue> = {};
  const errors: string[] = [];

  for (const [field, rule] of Object.entries(rules)) {
    const result = checkField(input[field], rule);
    if ("error" in result) errors.push(result.error);
    else row[field] = result.value;
  }

  // ISO date strings compare correctly as text. A pair is skipped when either date is
  // missing or invalid (already reported above) or NULL (e.g. an ongoing project).
  for (const { start, end, message } of dateOrders) {
    const startValue = row[start];
    const endValue = row[end];
    if (typeof startValue === "string" && typeof endValue === "string" && endValue < startValue) {
      errors.push(message);
    }
  }

  if (errors.length > 0) throw new ValidationError(errors.join(" "));
  return row as Record<keyof R, CleanValue>; // every key of `rules` was filled in the loop above
}
