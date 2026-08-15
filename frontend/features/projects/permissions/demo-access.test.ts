import { describe,expect,it } from "vitest";
import { projectDemoUrl,resolveDemoProjectAccess } from "./demo-access";

describe("demo project access navigation",()=>{
  it("resolves only supported personas",()=>{expect(resolveDemoProjectAccess("view")).toBe("view");expect(resolveDemoProjectAccess("none")).toBe("none");expect(resolveDemoProjectAccess(null)).toBe("manage");});
  it("preserves view access across project destinations",()=>{for(const path of ["/projects","/projects/new","/projects/prj-026","/projects/prj-026/edit"])expect(projectDemoUrl(path,"view")).toContain("access=view");});
  it("preserves tabs and replaces an existing persona",()=>{const params=new URLSearchParams("tab=documents&access=manage");expect(projectDemoUrl("/projects/prj-026","none",params)).toBe("/projects/prj-026?tab=documents&access=none");});
});
