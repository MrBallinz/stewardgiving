// Shared formatting utilities for currency and percentages.
export const formatCurrency = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(n ?? 0));

export const formatCurrencyCompact = (n: number | null | undefined) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(n ?? 0));

export const formatPercent = (n: number | null | undefined) =>
  `${Number(n ?? 0).toFixed(1)}%`;

export const monthLabel = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { month: "long", year: "numeric" });
