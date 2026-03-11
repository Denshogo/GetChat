export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
}

export function formatDateTime(isoString) {
  if (!isoString) {
    return "";
  }

  const date = new Date(isoString);

  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function normalizeTopic(raw) {
  return raw.replace(/^[\s　]+|[\s　]+$/g, "").replace(/[。！!？?]+$/, "");
}
