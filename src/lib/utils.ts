import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely extracts a user-readable error message from any error, object, or string.
 * Prevents opaque '[object Object]' strings from reaching the UI.
 */
export function getErrorMessage(error: unknown, fallback = "An unexpected error occurred"): string {
  if (!error) return fallback;
  if (typeof error === "string" && error.trim()) return error;

  if (error instanceof Error) {
    if (error.message && error.message !== "[object Object]") {
      return error.message;
    }
    if (error.cause) {
      const causeMsg = getErrorMessage(error.cause, "");
      if (causeMsg) return causeMsg;
    }
  }

  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;
    const msg = obj["message"];
    if (typeof msg === "string" && msg && msg !== "[object Object]") {
      return msg;
    }
    if (typeof msg === "object" && msg !== null) {
      try {
        return JSON.stringify(msg);
      } catch {
        /* ignore */
      }
    }
    const errProp = obj["error"];
    if (typeof errProp === "string" && errProp) {
      return errProp;
    }
    if (typeof errProp === "object" && errProp !== null) {
      const innerMsg = getErrorMessage(errProp, "");
      if (innerMsg) return innerMsg;
    }
  }

  return fallback;
}

