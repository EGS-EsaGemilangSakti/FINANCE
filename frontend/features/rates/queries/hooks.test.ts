import { describe,expect,it } from "vitest";
import { queryKeys } from "@/lib/query-keys";
import { rateInvalidationKeys } from "./hooks";

describe("rate mutation invalidation",()=>{
 it("includes target, previous Active, audits, current, list and project readiness",()=>{
  const keys=rateInvalidationKeys("prj-026",{id:"rate-v3",version:2,status:"Active",previousActiveId:"rate-v2",message:"ok",correlationId:"corr"});
  expect(keys).toEqual(expect.arrayContaining([
   queryKeys.rates.listRoot("prj-026"),queryKeys.rates.current("prj-026"),queryKeys.rates.detail("prj-026","rate-v3"),queryKeys.rates.comparisons("prj-026","rate-v3"),queryKeys.rates.impact("prj-026","rate-v3"),queryKeys.rates.readiness("prj-026","rate-v3"),queryKeys.rates.detail("prj-026","rate-v2"),queryKeys.audit.byObject("RateVersion","rate-v3"),queryKeys.audit.byObject("RateVersion","rate-v2"),queryKeys.projects.readiness("prj-026")
  ]));
 });
});
