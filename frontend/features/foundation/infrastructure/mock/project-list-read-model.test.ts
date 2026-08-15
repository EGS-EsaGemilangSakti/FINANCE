import { describe,expect,it } from "vitest";
import { applyProjectListQuery } from "./adapter";

describe("project list read model",()=>{
  it("contains all list metadata after filtering and pagination",()=>{const result=applyProjectListQuery({search:"PRJ-ESA-026",statuses:["Draft"],sort:"code",direction:"asc",page:1,pageSize:1});const item=result.items[0];expect(result).toMatchObject({total:1,page:1,pageSize:1,hasNextPage:false});expect(item).toMatchObject({id:"prj-026",code:"PRJ-ESA-026",customerId:"cus-aruna",customerName:"PT Aruna Nusantara",picUserId:"usr-raka",picName:"Raka Pratama",billingCycleId:"bc-monthly",branchCount:1,serviceCount:1,status:"Draft",version:3});expect(item?.contractStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);expect(item?.readiness).toMatchObject({ready:true,completedCount:12,totalCount:12,blockerCount:0});expect(item?.updatedAt).toContain("T");});
});
