import { z } from "zod";
export const invoiceDraftSchema = z.object({ invoiceDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib berformat YYYY-MM-DD"), note: z.string().max(500, "Maksimal 500 karakter"), sourceOptionId: z.string().optional(), lines: z.array(z.object({ id: z.string().min(1), description: z.string().trim().min(3, "Deskripsi minimal 3 karakter").max(160) })).optional() });
export type InvoiceDraftFormValues = z.infer<typeof invoiceDraftSchema>;

const trimmed = (label: string, maximum = 500) => z.string().trim().min(1, `${label} wajib diisi`).max(maximum, `${label} maksimal ${maximum} karakter`);
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal wajib berformat YYYY-MM-DD");
const channel = z.enum(["Meeting", "Phone", "EmailMetadata", "DocumentReference"]);
const evidenceFields = { channel, customerContactName: trimmed("Customer contact", 160), reference: trimmed("Evidence reference", 200), note: trimmed("Catatan", 500) };

const attestation = z.boolean().refine(value => value, "Attestation wajib disetujui");
export const requestConfirmationSchema = z.object({ ...evidenceFields, requestDate: isoDate, attestation });
export const revisionRequestSchema = z.object({ ...evidenceFields, responseDate: isoDate, reason: trimmed("Alasan revisi", 500), customerRequestSummary: trimmed("Requested change", 500) });
export const resubmitRevisionSchema = z.object({ resolutionSummary: trimmed("Resolution summary", 500), attestation });
export const customerConfirmedSchema = z.object({ ...evidenceFields, confirmedAt: z.string().datetime({ offset: true, message: "Waktu konfirmasi wajib ISO-8601 dengan timezone" }), statement: trimmed("Confirmation summary", 500), attestation });
export const revisionEditorSchema = invoiceDraftSchema.extend({ resolutions: z.array(z.object({ requestedChangeId: z.string().min(1), resolved: z.boolean(), resolutionNote: z.string().trim().max(500) }).superRefine((value, context) => { if (value.resolved && !value.resolutionNote) context.addIssue({ code: "custom", path: ["resolutionNote"], message: "Resolution note wajib ketika resolved" }); })) });

export type RequestConfirmationFormValues = z.infer<typeof requestConfirmationSchema>;
export type RevisionRequestFormValues = z.infer<typeof revisionRequestSchema>;
export type ResubmitRevisionFormValues = z.infer<typeof resubmitRevisionSchema>;
export type CustomerConfirmedFormValues = z.infer<typeof customerConfirmedSchema>;
export type RevisionEditorFormValues = z.infer<typeof revisionEditorSchema>;
