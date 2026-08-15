import { format, isValid, parseISO } from "date-fns";
import { id } from "date-fns/locale";
import Decimal from "decimal.js";

const locale = "id-ID";
export type NumericValue = Decimal.Value;
const toNumber = (value: NumericValue) => new Decimal(value).toNumber();

export function formatRupiah(value: NumericValue, compact = false) {
  return new Intl.NumberFormat(locale, { style: "currency", currency: "IDR", maximumFractionDigits: 0, notation: compact ? "compact" : "standard" }).format(toNumber(value));
}
export function formatNumber(value: NumericValue, maximumFractionDigits = 0) {
  return new Intl.NumberFormat(locale, { maximumFractionDigits }).format(toNumber(value));
}
export function formatPercent(value: NumericValue, maximumFractionDigits = 1) {
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits }).format(new Decimal(value).div(100).toNumber());
}
export function formatDate(value: Date | string | number, withTime = false) {
  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(parsed) ? format(parsed, withTime ? "dd MMM yyyy, HH.mm" : "dd MMM yyyy", { locale: id }) : "-";
}
export function formatLongDate(value: Date | string | number) {
  const parsed = typeof value === "string" ? parseISO(value) : new Date(value);
  return isValid(parsed) ? format(parsed, "EEEE, d MMMM yyyy", { locale: id }) : "-";
}
export function formatBytes(value:number){if(!Number.isFinite(value)||value<0)return"-";if(value<1024)return`${value} B`;if(value<1024*1024)return`${new Decimal(value).div(1024).toDecimalPlaces(1)} KB`;return`${new Decimal(value).div(1024*1024).toDecimalPlaces(1)} MB`;}
