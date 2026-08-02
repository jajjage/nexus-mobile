const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function formatNumber(value: number, fractionDigits = 0): string {
  const safeValue = Number.isFinite(value) ? Math.abs(value) : 0;
  const fixed = safeValue.toFixed(fractionDigits);
  const [integerPart, decimalPart] = fixed.split(".");
  const grouped = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  return decimalPart ? `${grouped}.${decimalPart}` : grouped;
}

export function formatCurrency(amount: number): string {
  return `₦${formatNumber(amount, 2)}`;
}

export function formatShortDate(date: Date | string | undefined): string {
  if (!date) return "N/A";

  const parsed = typeof date === "string" ? new Date(date) : date;

  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return "Invalid Date";
  }

  return `${parsed.getDate()} ${MONTHS_SHORT[parsed.getMonth()]} ${parsed.getFullYear()}`;
}

export function formatLongDateTime(date: Date | string | undefined): string {
  if (!date) return "N/A";

  const parsed = typeof date === "string" ? new Date(date) : date;

  if (!(parsed instanceof Date) || Number.isNaN(parsed.getTime())) {
    return "Invalid Date";
  }

  const hours = parsed.getHours();
  const minutes = parsed.getMinutes().toString().padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = (hours % 12 || 12).toString().padStart(2, "0");

  return `${MONTHS_LONG[parsed.getMonth()]} ${parsed.getDate()}, ${parsed.getFullYear()}, ${displayHour}:${minutes} ${period}`;
}
