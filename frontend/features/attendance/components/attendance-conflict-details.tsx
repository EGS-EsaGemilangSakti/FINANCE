import type { AttendanceMutationErrorView } from "../domain/mutation-error";

export function AttendanceConflictDetails({ conflict }: { conflict: NonNullable<AttendanceMutationErrorView["conflict"]> }) {
  return <div className="conflict-details" aria-label="Perbandingan versi conflict"><dl className="detail-list"><dt>Versi dikirim</dt><dd>{conflict.userVersion}</dd><dt>Versi terbaru</dt><dd>{conflict.latestVersion}</dd><dt>Revision terbaru</dt><dd>{conflict.revision ?? "-"}</dd></dl>{conflict.diffs.length > 0 && <table><caption>Perubahan aman sejak versi dikirim</caption><thead><tr><th scope="col">Field</th><th scope="col">Sebelumnya</th><th scope="col">Terbaru</th></tr></thead><tbody>{conflict.diffs.map(diff => <tr key={diff.field}><th scope="row">{diff.label}</th><td>{diff.before}</td><td>{diff.after}</td></tr>)}</tbody></table>}</div>;
}
