import type { BillingCycleFields } from "./types";

const frequencyLabel={Monthly:"bulanan",Biweekly:"dua mingguan",Weekly:"mingguan"} as const;

export function billingCycleSummary(values:Pick<BillingCycleFields,"frequency"|"cutoffDay"|"invoiceOffsetDays"|"dueDays">):string|null{
 if(!Number.isInteger(values.cutoffDay)||values.cutoffDay<1||values.cutoffDay>31||!Number.isInteger(values.invoiceOffsetDays)||values.invoiceOffsetDays<0||!Number.isInteger(values.dueDays)||values.dueDays<0)return null;
 return `Siklus ${frequencyLabel[values.frequency]} ditutup setiap tanggal ${values.cutoffDay}. Invoice disiapkan ${values.invoiceOffsetDays} hari setelah cutoff dan jatuh tempo ${values.dueDays} hari setelah diterbitkan.`;
}
