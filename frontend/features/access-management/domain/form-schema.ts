import { z } from "zod";
import { permissionCatalog } from "./logic";
const permissionKeys=permissionCatalog.map(item=>item.key);
export const userFormSchema=z.object({employeeId:z.string().trim().min(2,"Identifier wajib diisi."),name:z.string().trim().min(3,"Nama minimal 3 karakter."),email:z.email("Email tidak valid."),roleIds:z.array(z.string()).min(1,"Pilih minimal satu role."),projectScopeIds:z.array(z.string()),reason:z.string().trim().min(3,"Alasan wajib diisi.")});
export const roleFormSchema=z.object({code:z.string().trim().regex(/^[A-Z0-9_-]{2,30}$/,"Kode memakai huruf kapital, angka, underscore, atau dash."),name:z.string().trim().min(3,"Nama minimal 3 karakter."),description:z.string().max(500),permissionKeys:z.array(z.string()).refine(values=>values.every(value=>permissionKeys.includes(value as (typeof permissionKeys)[number])),"Permission tidak dikenal."),reason:z.string().trim().min(3,"Alasan wajib diisi.")});
export type UserFormValues=z.infer<typeof userFormSchema>;export type RoleFormValues=z.infer<typeof roleFormSchema>;
