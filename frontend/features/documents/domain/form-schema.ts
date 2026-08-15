import { z } from "zod";
import type { DocumentObjectType } from "@/features/foundation/domain/models";
import { allowedDocumentCategories } from "./validation";

export function createDocumentFormSchema(objectType:DocumentObjectType){const allowed=allowedDocumentCategories(objectType),category=z.custom<(typeof allowed)[number]>((value)=>typeof value==="string"&&allowed.some(candidate=>candidate===value),{message:"Kategori tidak sesuai jenis owner."});return z.object({category,title:z.string().trim().min(3,"Judul minimal 3 karakter.").max(120,"Judul maksimal 120 karakter."),description:z.string().max(500,"Deskripsi maksimal 500 karakter."),required:z.boolean(),reason:z.string().trim().min(3,"Alasan wajib diisi."),notes:z.string().max(500,"Catatan maksimal 500 karakter.")});}
export type DocumentCreateFormValues=z.input<ReturnType<typeof createDocumentFormSchema>>;
