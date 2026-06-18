export function formatDate(value: Date | string, locale = "ru-RU"): string {
  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(typeof value === "string" ? new Date(value) : value);
}
