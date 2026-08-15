# Prompt Bertahap Codex - ESA Finance Frontend

Dokumen ini berisi prompt yang dijalankan secara berurutan. Jangan mengirim semua prompt sekaligus. Selesaikan, verifikasi, dan review hasil satu tahap sebelum melanjutkan ke tahap berikutnya.

## Cara menggunakan

1. Mulai dari Tahap 0.
2. Salin satu prompt tahap ke Codex.
3. Review hasil UI, perilaku, lint, dan build.
4. Catat keputusan atau perubahan requirement.
5. Lanjutkan hanya setelah exit criteria tahap tersebut terpenuhi.

Jika aplikasi sudah melewati suatu tahap, gunakan prompt tahap itu sebagai audit dan gap analysis sebelum melanjutkan.

## Stack library yang wajib digunakan

Gunakan stack ini pada seluruh tahap. Jangan mengganti atau menambah library dengan fungsi yang sama tanpa alasan teknis yang terdokumentasi.

| Kebutuhan | Library | Aturan utama |
|---|---|---|
| Chart dan visualisasi KPI | `recharts` | Gunakan `ResponsiveContainer`; sediakan legend, tooltip, unit, empty/loading state, dan text/table equivalent. Jangan membuat production chart dengan raw SVG. |
| Ikon aplikasi | `@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/free-regular-svg-icons` | Import ikon satu per satu. Jangan import seluruh pack atau mencampur Font Awesome dan Lucide dalam satu fitur. |
| Tabel finance | `@tanstack/react-table` | Controlled server pagination, sorting, filtering, column visibility, row selection, dan stable column definitions. |
| Fetching dan server state | `@tanstack/react-query` | Query key per domain, cancellation, invalidation setelah mutation, serta tanpa optimistic update untuk transaksi finance. |
| Form dan state field | `react-hook-form` | Gunakan uncontrolled input bila memungkinkan; `Controller` hanya untuk custom input yang membutuhkannya. |
| Schema dan validasi | `zod`, `@hookform/resolvers` | Schema typed, error dekat field, form error summary, dan mapping backend `field_errors`. |
| Upload/import | `react-dropzone` | Preview file, MIME/size feedback, progress, retry, dan error report. Backend tetap memvalidasi dan melakukan scanning. |
| Tanggal | `date-fns` | Tampilan locale Indonesia, nilai API ISO-8601, dan label tanggal domain harus eksplisit. |
| Angka finansial | `decimal.js` | Wajib untuk money, tax, rounding, allocation, reconciliation, subtotal, dan total. Jangan menghitung uang dengan floating point JavaScript. |
| Toast | `sonner` | Hanya feedback singkat. Hasil financial action juga harus tampil permanen di halaman/timeline. |
| Class utility | `clsx`, `tailwind-merge` | Satukan melalui helper `cn()` reusable. |

`lucide-react` masih terdapat pada prototype dashboard lama. Saat suatu komponen disentuh secara material, migrasikan seluruh ikon di komponen tersebut ke Font Awesome. Jangan melakukan migrasi setengah komponen.

---

## Tahap 0 - Audit, arsitektur frontend, dan design system

### Tujuan

Mengunci fondasi teknis dan visual sebelum membangun alur bisnis.

### Prompt

```text
Anda adalah lead frontend engineer dan product-minded UI/UX engineer untuk sistem Finance & Project Operations PT Esa Gemilang Sakti.

Kerjakan hanya Tahap 0 di direktori `frontend`.

Sebelum mengubah kode:
1. Baca dan patuhi `frontend/AGENTS.md`.
2. Analisis kelima PDF di `output/finance-system-requirements/`, dengan fokus pada prinsip UX, information architecture, role, state transaksi, accessibility, dan user journey.
3. Audit struktur aplikasi, dependency, konfigurasi, reusable component, responsive behavior, dan technical debt yang sudah ada.
4. Baca dokumentasi Next.js lokal yang relevan di `frontend/node_modules/next/dist/docs/`.
5. Gunakan `frontend/public/image/logo_fix.svg` sebagai sumber identitas visual.

Scope Tahap 0:
- Susun arsitektur folder berbasis domain dan shared UI.
- Tetapkan design token: warna, typography, spacing, radius, border, shadow, icon, dan semantic status.
- Buat atau rapikan komponen dasar: Button, IconButton, Input, Select, Badge, StatusBadge, Card, EmptyState, Skeleton, Alert, Modal/Drawer, Table shell, dan PageHeader.
- Siapkan application shell: sidebar, topbar, mobile navigation, global search placeholder, notification placeholder, dan profile menu.
- Siapkan helper format tanggal, angka, persen, dan Rupiah untuk locale `id-ID`.
- Siapkan pola loading, empty, zero result, permission denied, 409 conflict, 422 validation, dan server error dengan correlation ID.
- Buat provider TanStack Query pada client boundary yang sempit, shared `cn()` helper, formatter berbasis date-fns/Decimal.js, konfigurasi Sonner, serta wrapper Font Awesome yang menjaga ukuran dan accessibility konsisten.
- Buat reusable chart shell berbasis Recharts dan reusable data-table shell berbasis TanStack Table. Tahap ini cukup menyediakan fondasi dan satu contoh terverifikasi, bukan seluruh report.
- Pertahankan dashboard yang sudah ada, tetapi refactor bila diperlukan agar memakai fondasi reusable.

Batasan:
- Jangan membangun API palsu yang terlihat seperti integrasi production.
- Data demo harus jelas sebagai mock data.
- Jangan mengimplementasikan business flow lengkap pada tahap ini.
- Gunakan Server Component secara default dan Client Component hanya pada boundary interaktif.
- Hindari UI template generik, gradient berlebihan, glassmorphism berlebihan, emoji sebagai ikon, dan penggunaan warna emas secara berlebihan.

Definition of done:
- Design system konsisten dengan logo: warm charcoal, off-white, dan restrained gold.
- Application shell responsif untuk desktop, tablet 768px, dan mobile.
- Komponen dasar dapat digunakan ulang oleh seluruh domain.
- Keyboard navigation, visible focus, label, semantic HTML, dan contrast memenuhi WCAG 2.1 AA.
- `npm run lint` dan `npm run build` berhasil tanpa error atau warning.
- Laporkan file yang berubah, keputusan desain, mock yang digunakan, dan gap yang diteruskan ke Tahap 1.
```

### Exit criteria

- Fondasi komponen tidak perlu dibangun ulang pada tahap berikutnya.
- Tema dan perilaku responsif sudah tervalidasi.
- Struktur domain dan kontrak state sudah terdokumentasi.

---

## Tahap 1 - Foundation: IAM, master data, project, SPH, dan rate

### Tujuan

Membangun fondasi operasional sebelum transaksi revenue dan cost dibuat.

### Prompt

```text
Lanjutkan pembangunan ESA Finance Frontend dengan mengerjakan hanya Tahap 1 - Foundation.

Sebelum mulai:
1. Baca dan patuhi `frontend/AGENTS.md`.
2. Review hasil Tahap 0 dan pertahankan design system yang sudah disepakati.
3. Baca bagian role, master data, project, SPH, rate versioning, RBAC, SoD, document, dan audit dari seluruh PDF requirement.
4. Baca dokumentasi Next.js lokal yang relevan sebelum memakai API framework.

Scope Tahap 1:
- Project List dengan search, filter, status, pagination, saved-view placeholder, dan empty state.
- Project Create/Edit dengan Project Code, customer, vendor, PIC, tanggal kontrak, billing cycle, cost center, SPH, cabang, dokumen, dan status.
- Project Detail dengan tab Overview, Contract/SPH, Rates, Workforce, Invoices, Expenses, Profitability, Documents, dan Audit. Tab yang belum dibangun boleh berupa informative placeholder.
- Checklist kesiapan project sebelum aktivasi.
- Party master untuk customer dan vendor.
- Service master, billing cycle, tax rule placeholder, dan master referensi yang diperlukan.
- Rate Versioning: effective date, service, rate type, amount/formula, version timeline, compare before-after, overlap warning, reason, dan impact notice.
- User/Role screens, permission matrix, activation/deactivation, dan SoD conflict warning.
- Document metadata/version UI dan read-only audit timeline dasar.

Business rules wajib:
- Project Code unik.
- Project closed menolak transaksi baru.
- Rate bersifat effective-dated dan versioned.
- Rentang effective rate aktif tidak boleh overlap untuk kombinasi yang sama.
- Perubahan rate tidak mengubah transaksi historis yang sudah final.
- PIC adalah final approver, sedangkan Admin tidak menyetujui transaksi.
- Permission hiding pada UI bukan pengganti authorization backend.

State wajib:
- Loading/skeleton.
- Empty dan zero filtered result.
- Field validation dan form error summary.
- Permission denied.
- 409 stale version dengan diff/reload.
- 422 invalid state.
- Server error dengan correlation ID dan safe retry.

Gunakan service/repository interface yang dapat diganti dari mock ke API. Jangan mengarang endpoint di luar baseline SRS Backend. Jika backend belum tersedia, gunakan typed mock adapter dan tandai dengan jelas.

Definition of done:
- User dapat memahami dan menjalankan journey Setup Project dan Rate dari Draft sampai siap Active.
- Rate timeline, diff, overlap warning, reason, dan historical immutability terlihat jelas.
- Semua form dapat diselesaikan dengan keyboard.
- Desktop, tablet, dan mobile review sudah diperiksa.
- `npm run lint` dan `npm run build` berhasil tanpa error atau warning.
- Laporkan implementasi, route, mock/API contract, test, dan gap menuju Tahap 2.
```

### Exit criteria

- Satu project dengan SPH, cabang, party, service, dan rate version dapat disiapkan sampai status siap transaksi.
- Role dan permission presentation sudah konsisten.

---

## Tahap 2 - Revenue MVP: attendance, payroll billing, dan invoice

### Tujuan

Menyelesaikan alur revenue dari import attendance sampai invoice released dan sent.

### Prompt

```text
Lanjutkan ESA Finance Frontend dengan mengerjakan hanya Tahap 2 - Revenue MVP.

Prasyarat:
- Audit hasil Tahap 0 dan Tahap 1.
- Baca dan patuhi `frontend/AGENTS.md`.
- Baca requirement Attendance Import, Payroll Run, Invoice Builder, Customer Confirmation, Approval, Release, Tax Document, AR creation, exception journey, dan acceptance criteria frontend/backend.

Scope Tahap 2A - Attendance Import:
- Template download action.
- Drag-and-drop/upload control dengan file rules.
- Gunakan React Dropzone untuk drag-drop, file state, MIME/size feedback, dan accessible keyboard activation.
- Project dan period selection.
- Mapping preview.
- Row validation table berisi row, column, value, dan reason.
- Duplicate/checksum warning.
- Valid, invalid, dan duplicate summary.
- Downloadable error report placeholder/flow.
- Explicit commit decision; jangan memasukkan partial row secara diam-diam.
- Batch detail, correction revision, validation, dan lock.

Scope Tahap 2B - Payroll Billing Run:
- Pilih project dan period.
- Calculated lines dan component breakdown.
- Gaji prorata/HK, reward, bonus/THR, BPJS, management fee, PPN, PPh, dan komponen konfigurabel sebagai presentational model sesuai data source.
- Calculation drawer yang menjelaskan formula, input, rate version, rounding, tax basis, dan source line.
- Gunakan Decimal.js untuk seluruh subtotal, fee, tax, withholding, rounding, variance, dan reconciliation yang dihitung di client.
- Anomaly/exception list.
- Adjustment wajib reason.
- Recalculation membuat revision, bukan overwrite hasil approved.
- Review dan lock.

Scope Tahap 2C - Invoice:
- Draft Invoice list dan Invoice Builder.
- Satu invoice untuk satu SPH; cabang menjadi rincian.
- Auto-fill project, customer, rate snapshot, payroll source, fee, charges, dan tax.
- Source reconciliation: total source versus invoice lines harus menunjukkan variance nol sebelum submit.
- Tax dan rounding preview.
- PDF preview dengan fallback download.
- Save draft dan visible autosave timestamp hanya untuk draft.
- Customer confirmation evidence dan revision loop.
- Version diff.
- Approval panel berisi angka utama, source breakdown, tax, dokumen, comment, dan attestation.
- Reject/revise wajib reason.
- Release menghasilkan nomor/final snapshot immutable, AR created state, tax document task, dan send log.

State/status minimum:
- Attendance: Draft, Imported, Validated, Calculated, Locked, Rejected.
- Invoice: Draft, Pending Customer, Revision, Pending Approval, Approved, Released, Sent, Partially Paid, Paid, Void, Overdue.

Business rules:
- Jangan mencampur payroll billing invoice dengan payroll pembayaran gaji karyawan.
- Invoice released tidak dapat diedit; koreksi melalui revision policy.
- PIC mencatat customer confirmation dan menjadi final approver.
- Financial actions menunggu server confirmation dan harus tercatat di activity timeline.
- Rate yang dipakai harus berupa snapshot versi saat kalkulasi.

Implementasikan journey secara bertahap dalam kode: Attendance Import -> Payroll Billing Run -> Invoice. Setelah setiap sub-tahap, jalankan lint/build dan periksa UI sebelum melanjutkan.

Definition of done:
- Happy path dan exception path revenue dapat didemonstrasikan tanpa copy-paste data manual.
- Approver dapat memahami apa yang disetujui dalam beberapa menit.
- Source breakdown, version, document, tax, diff, status, dan next action terlihat jelas.
- `npm run lint` dan `npm run build` berhasil tanpa error atau warning.
- Laporkan route, state, mock/API contract, validasi, dan gap menuju Tahap 3.
```

### Exit criteria

- Attendance valid/invalid/duplicate dapat direview dan dikunci.
- Payroll billing dapat direkonsiliasi.
- Invoice dapat melewati confirmation, revision, approval, release, tax task, dan send state.

---

## Tahap 3 - Cost MVP: payment request, approval, dan pembayaran manual

### Tujuan

Menyelesaikan alur cost dari request hingga bukti pembayaran dan recorded project cost.

### Prompt

```text
Lanjutkan ESA Finance Frontend dengan mengerjakan hanya Tahap 3 - Cost MVP.

Sebelum mulai:
- Baca dan patuhi `frontend/AGENTS.md`.
- Audit hasil tahap sebelumnya.
- Baca requirement Payment Request, Approval Queue, Payment Execution, document evidence, duplicate control, cost traceability, dan exception journey.

Scope:
- Payment Request list dengan filter status, project, vendor, periode, owner, dan SLA/age.
- Create/Edit Payment Request: project, vendor, expense type/COA, amount, Document Date, Entry Date, description, attachment, dan tax context bila tersedia.
- Project context panel yang menampilkan project, SPH, owner, dan cost impact yang valid.
- Duplicate warning berdasarkan vendor, document number, date, dan amount.
- Document completeness dan scanning state.
- Finance verification dan revision comment.
- PIC approval detail dengan summary amount, project, vendor, history, evidence, comment, dan attestation.
- Approve, reject, dan revise; reject/revise wajib reason.
- Bank Holder approved-only work queue.
- Manual payment execution: bank reference, Payment Date, actual amount, evidence upload, dan partial/split policy placeholder hanya bila diizinkan.
- Finance recording dan source-linked project cost status.
- Activity timeline dan audit link dari request hingga Paid/Recorded.

Status minimum:
- Draft, Submitted, Under Review, Revision, Approved, Rejected, Paid, Recorded, Cancelled.

Business rules:
- Request tidak dapat dibayar sebelum PIC approve.
- Bank Holder hanya melihat queue yang approved dan tidak boleh mengubah request.
- Supporting document wajib sesuai rule.
- Payment evidence tidak boleh diganti diam-diam; replacement membuat document version.
- Jika actual payment berbeda, sistem menolak atau meminta reason sesuai policy yang tersedia.
- Document Date, Entry Date, dan Payment Date harus memiliki label dan nilai terpisah.
- Payment replay harus siap menggunakan Idempotency-Key.

State wajib:
- Approved queue kosong dan populated.
- Missing evidence.
- Duplicate warning.
- Rejected lalu resubmitted tanpa menghapus history.
- Amount mismatch/partial payment policy.
- Permission denied untuk role yang salah.
- 409 conflict, 422 invalid transition, dan server error dengan correlation ID.

Definition of done:
- Satu request dapat ditelusuri dari draft sampai recorded cost.
- SoD terlihat jelas antara requester, PIC, Bank Holder, dan Finance.
- Bukti, approval history, amount, tanggal, dan next action mudah diverifikasi.
- `npm run lint` dan `npm run build` berhasil tanpa error atau warning.
- Laporkan route, mock/API contract, test, dan gap menuju Tahap 4.
```

### Exit criteria

- Payment request approved-paid-recorded dan rejected-resubmitted dapat didemonstrasikan.
- Bank Holder hanya mendapat task yang sah dan lengkap.

---

## Tahap 4 - AR, receipts, dashboard, dan reporting

### Tujuan

Memberikan monitoring yang dapat direkonsiliasi dan ditelusuri sampai transaksi sumber.

### Prompt

```text
Lanjutkan ESA Finance Frontend dengan mengerjakan hanya Tahap 4 - AR, Receipts, Dashboard, dan Reporting.

Sebelum mulai:
- Baca dan patuhi `frontend/AGENTS.md`.
- Audit hasil Tahap 1-3 dan gunakan source links yang sudah tersedia.
- Baca requirement AR aging, receipt allocation, profitability, cost analysis, cash flow, payment/document monitoring, dashboard drill-down, export, dan management review.

Scope Tahap 4A - AR dan Receipts:
- AR Aging dengan filter customer, SPH, project, status, due date, dan aging bucket.
- Invoice outstanding detail dengan sent log, receipt, follow-up note, owner, dan SLA.
- Record Receipt: bank reference, receipt date, amount, evidence, dan allocation.
- Partial, full, dan overpayment/credit balance presentation.
- Customer statement dan export action.
- Overdue reminder/follow-up timeline.
- Refund/carry-forward ditampilkan sebagai policy belum dikunci bila belum tersedia.

Scope Tahap 4B - Dashboard dan Reports:
- Role-aware dashboard untuk PIC, Payroll Invoice, Finance/A/R, A/P, Manager, Bank Holder, dan Management.
- Revenue, cost, gross profit, margin, AR outstanding/aging, cash in/out, payment monitoring, document status, dan project exceptions.
- Profitability project: revenue, payroll cost, operational cost, gross profit, margin, dan source transaction.
- Cost analysis dan payment monitoring.
- Cash flow view.
- Document tracking.
- Freshness timestamp, reconciliation status, filter context, saved filter placeholder, dan export.
- Semua KPI dapat di-drilldown sambil mempertahankan filter context.
- Implementasikan chart menggunakan Recharts: line/area untuk tren revenue-cost-profit, bar/composed untuk perbandingan project dan cash flow, serta donut hanya untuk komposisi yang memang cocok. Hindari pie chart dengan terlalu banyak kategori.
- Implementasikan tabel drill-down menggunakan TanStack Table dengan state pagination/filter/sort yang siap dikendalikan server.
- Lazy-load chart/report berat yang tidak diperlukan pada initial viewport.

Business rules:
- Profitability baseline adalah invoiced revenue dikurangi recorded project costs.
- Jangan mengaktifkan Budget vs Actual sebagai MVP karena kebijakan budget masih hold.
- AR aging dihitung dari due date.
- Allocation mengurangi outstanding; overpayment menjadi credit balance terpisah.
- Export mengikuti permission dan harus siap dicatat pada audit.
- Tampilkan source dan freshness agar angka dapat dipercaya.

State wajib:
- No AR, overdue AR, partial payment, paid, dan credit balance.
- Empty report dan zero filtered result.
- Data stale/freshness warning.
- Reconciliation exception.
- Export queued, progress, completed, dan downloadable error.
- Permission denied dan masked financial/PII fields sesuai role.

Definition of done:
- Direksi dapat membuka margin project dan mencapai transaksi penyebabnya.
- Finance dapat membuka aging bucket dan mencapai invoice, receipt, evidence, serta follow-up.
- Dashboard tidak menampilkan angka tanpa source/freshness context.
- `npm run lint` dan `npm run build` berhasil tanpa error atau warning.
- Laporkan route, drill-down chain, mock/API contract, dan gap menuju Tahap 5.
```

### Exit criteria

- Partial lalu final receipt memperbarui outstanding dan status secara konsisten.
- KPI dan laporan dapat ditelusuri sampai source transaction.

---

## Tahap 5 - Accounting opsional

### Tujuan

Menambahkan UI accounting hanya setelah MVP revenue, cost, dan reporting stabil.

### Prompt

```text
Kerjakan Tahap 5 - Accounting hanya jika stakeholder sudah menyetujui modul accounting pasca-MVP dan backend contract tersedia.

Sebelum mulai:
- Baca dan patuhi `frontend/AGENTS.md`.
- Audit stabilitas Tahap 1-4.
- Konfirmasi requirement COA, posting rule, period close, reversal, dan accounting permission dari dokumen dan keputusan terbaru.
- Jangan mengubah frontend menjadi full ERP tanpa persetujuan scope.

Scope:
- Chart of Accounts management sesuai permission.
- Journal Entry list/detail dengan source transaction link.
- Debit/credit lines dan balanced total.
- Draft, Posted, dan Reversed status.
- Posting review, attestation, dan audit trail.
- Reversal flow; posted journal immutable.
- Accounting Period: Open, Soft Closed, Closed, dan Reopened.
- Period close checklist dan exception list.
- Backdated transaction rejection dan next-period adjustment/reversal path.
- Accounting export.

Business rules:
- Total debit harus sama dengan total credit.
- Posted journal immutable.
- Closed period menolak posting/edit backdated.
- Correction menggunakan reversal atau authorized reopen, bukan silent edit.
- Setiap journal harus traceable ke invoice, payment, receipt, atau source rule.

Definition of done:
- Source-linked journal, posting, reversal, dan period close dapat didemonstrasikan.
- Closed period exception memberikan next action yang aman.
- `npm run lint` dan `npm run build` berhasil tanpa error atau warning.
- Laporkan keputusan scope accounting dan gap menuju hardening.
```

### Exit criteria

- Accounting tetap berupa sub-ledger/ledger sederhana sesuai scope yang disetujui.
- Posting dan correction path dapat diaudit.

---

## Tahap 6 - Hardening, accessibility, performance, security, dan UAT

### Tujuan

Menyiapkan frontend untuk UAT dan operational sign-off.

### Prompt

```text
Lakukan Tahap 6 - Frontend Hardening dan UAT Readiness untuk ESA Finance.

Jangan menambah fitur bisnis besar. Fokus pada audit, perbaikan, test, dan operational readiness.

Audit wajib:
1. Traceability seluruh happy path dan exception path.
2. RBAC presentation dan direct-route safe state.
3. Semua transaction status dan legal state transition.
4. Financial review summary, confirmation, reason, attestation, dan activity timeline.
5. Responsive desktop, tablet minimum 768px, dan mobile approval/review.
6. WCAG 2.1 AA: keyboard, focus, headings, table semantics, labels, errors, contrast, status non-color, chart text equivalent, dan PDF fallback.
7. Performance: bundle/client boundary, lazy loading viewer/chart, table strategy, debounced search, image optimization, dan unnecessary rerender.
8. Security: tidak ada secret/token sensitif di client storage, unsafe HTML, PII leakage, raw financial telemetry, atau permission assumption.
9. Error handling: 403, 409, 422, retryable/non-retryable 5xx, offline, timeout, correlation ID, dan input preservation.
10. Async job: import/export/PDF generation progress, leave-and-return, notification, retry, dan error report.
11. Library consistency: tidak ada chart raw SVG production, tabel finance manual yang melewati TanStack Table, kalkulasi uang dengan floating point, import seluruh Font Awesome pack, atau library duplikat dengan fungsi yang sama.

UAT scenarios:
- Setup satu project dengan dua service rate dan effective version.
- Import attendance valid, invalid, dan duplicate; perbaiki lalu lock.
- Hitung payroll billing dengan komponen yang dikonfigurasi.
- Buat invoice, customer revision, PIC approval, release, tax document, dan send.
- Payment request approved-paid-recorded dan rejected-resubmitted.
- Partial receipt lalu final receipt; verifikasi aging dan status.
- Jika accounting diaktifkan: period close, backdated rejection, dan reversal.
- Rekonsiliasi dashboard profitability serta AR dengan source transaction.

Output:
- Perbaiki masalah yang ditemukan.
- Tambahkan atau lengkapi component/unit, integration, dan E2E test yang proporsional.
- Buat checklist UAT frontend dan daftar known limitations.
- Tandai dengan jelas bagian mock, API yang belum tersedia, dan keputusan discovery yang belum dikunci.
- Jalankan `npm run lint` dan `npm run build` serta test suite yang tersedia.
- Lakukan QA visual pada breakpoint utama dan pastikan tidak ada clipped text, overlap, horizontal overflow yang tidak disengaja, atau control yang tidak dapat dipakai.
- Berikan readiness report: passed, remaining risks, blockers, dan rekomendasi release.
```

### Exit criteria

- Seluruh skenario UAT utama dapat dijalankan.
- Tidak ada error lint/build dan tidak ada defect visual kritis.
- Known limitation serta dependency backend tercatat jelas.

---

## Prompt tambahan - Implementasi API per domain

Gunakan prompt ini setelah backend endpoint suatu domain tersedia. Jalankan terpisah untuk setiap domain, bukan sekaligus.

```text
Integrasikan frontend domain [NAMA DOMAIN] dengan backend API yang tersedia.

Sebelum mengubah kode:
- Baca `frontend/AGENTS.md`.
- Audit typed mock adapter dan UI state domain tersebut.
- Baca API contract/backend implementation yang benar-benar tersedia; jangan menebak endpoint atau payload.
- Pertahankan service/repository interface dan ganti adapter mock secara bertahap.

Wajib:
- Typed request/response dan runtime validation yang sesuai arsitektur project.
- Authentication/session sesuai keputusan backend; jangan menyimpan secret/token sensitif di localStorage.
- Permission tetap server-authoritative.
- Tangani 403, 409 dengan version diff, 422 field/rule error, dan 5xx dengan correlation ID.
- Gunakan Idempotency-Key untuk sensitive POST dan version/ETag untuk concurrent edit bila didukung.
- Preserve user input ketika request gagal.
- Loading, empty, retry, offline/timeout, dan stale-data state.
- Jangan menghapus mock sebelum seluruh layar domain sudah memiliki API replacement atau explicit fallback.

Verifikasi happy path, exception path, permission, duplicate submission, stale update, dan retry. Jalankan lint, build, dan test. Laporkan endpoint yang terintegrasi, endpoint yang belum tersedia, perubahan contract, dan sisa mock.
```
