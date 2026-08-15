import { describe,expect,it } from "vitest";
import { AppError } from "@/features/foundation/domain/errors";
import { mapDocumentMutationError } from "./mutation-error";
import { allowedDocumentCategories,allowedDocumentVersionTransitions,defaultDocumentCategory } from "./validation";

describe("final document remediation policies",()=>{
 it.each([["Project",["Project Brief","Other"],"Project Brief"],["SPH",["Contract","Other"],"Contract"],["RateVersion",["Rate Support","Other"],"Rate Support"]] as const)("uses one category policy for %s",(owner,categories,first)=>{expect(allowedDocumentCategories(owner)).toEqual(categories);expect(defaultDocumentCategory(owner)).toBe(first);});
 it("supports the final Pending and Scanning transition contract",()=>{expect(allowedDocumentVersionTransitions("Pending")).toEqual(["Scanning","Clean","Rejected","Failed"]);expect(allowedDocumentVersionTransitions("Scanning")).toEqual(["Clean","Rejected","Failed"]);expect(allowedDocumentVersionTransitions("Clean")).toEqual([]);});
 it("maps production form aliases and preserves unknown fields globally",()=>{const mapped=mapDocumentMutationError(new AppError(422,"INVALID","Periksa input.",{title:["Judul invalid"],mimeType:["MIME invalid"],legacy_date:["Tanggal invalid"],unknown:["Unknown"]},false,"corr-1"));expect(mapped.fieldErrors).toEqual({title:"Judul invalid",file:"MIME invalid"});expect(mapped.globalErrors).toEqual(["Tanggal invalid","Unknown"]);expect(mapped.correlationId).toBe("corr-1");});
 it("preserves cancellation",()=>{expect(()=>mapDocumentMutationError(new DOMException("cancel","AbortError"))).toThrowError(expect.objectContaining({name:"AbortError"}));});
});
