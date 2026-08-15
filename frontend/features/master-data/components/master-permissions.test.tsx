import { render,screen } from "@testing-library/react";
import { beforeEach,describe,expect,it,vi } from "vitest";
import { MasterListPage } from "./master-list-page";
import { MasterFormPage } from "./master-form-page";

let search="access=manage";
const listQuery=vi.fn();
vi.mock("next/navigation",()=>({useRouter:()=>({push:vi.fn(),replace:vi.fn(),refresh:vi.fn()}),usePathname:()=>"/master-data/services",useSearchParams:()=>new URLSearchParams(search)}));
vi.mock("../queries/hooks",()=>({useMasterList:(kind:unknown,params:unknown,enabled:boolean)=>listQuery(kind,params,enabled),useMasterDetail:(kind:unknown,id:unknown,enabled:boolean)=>({data:undefined,isPending:false,isError:false,enabled,kind,id}),useCreateParty:()=>({isPending:false}),useUpdateParty:()=>({isPending:false}),useCreateReference:()=>({isPending:false}),useUpdateReference:()=>({isPending:false}),useMasterTransition:()=>({isPending:false})}));

beforeEach(()=>{search="access=manage";listQuery.mockReset().mockReturnValue({data:{items:[{id:"svc-fm",code:"SVC-FM",name:"Facility Management",category:"Operations",unitOrRule:"Person-month",projectCount:1,status:"Active",updatedAt:"2026-08-10T10:00:00+07:00",version:2}],total:1,page:1,pageSize:20,hasNextPage:false},isPending:false,isError:false});});

describe("master permission UI",()=>{
 it("shows create and edit actions for manage",()=>{render(<MasterListPage kind="services"/>);expect(screen.getByRole("link",{name:"Buat layanan"})).toBeVisible();expect(screen.getAllByRole("link",{name:"Edit"})[0]).toBeVisible();expect(listQuery).toHaveBeenCalledWith("services",expect.any(Object),true);});
 it("hides mutation actions for view Reference Master",()=>{search="access=view";render(<MasterListPage kind="services"/>);expect(screen.queryByRole("link",{name:/Buat/})).not.toBeInTheDocument();expect(screen.queryByRole("link",{name:"Edit"})).not.toBeInTheDocument();expect(listQuery).toHaveBeenCalledWith("services",expect.any(Object),true);});
 it("shows denied and disables list query for none",()=>{search="access=none";render(<MasterListPage kind="services"/>);expect(screen.getByText("Akses master data dibatasi")).toBeVisible();expect(listQuery).toHaveBeenCalledWith("services",expect.any(Object),false);});
 it("denies direct create access for view",()=>{search="access=view";render(<MasterFormPage kind="services"/>);expect(screen.getByText("Tidak dapat mengelola master data")).toBeVisible();});
});
