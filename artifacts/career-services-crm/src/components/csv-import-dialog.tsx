import { FileSpreadsheet, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import type { CsvRow } from "@/lib/csv";
import { parseCsv } from "@/lib/csv";

type ImportResult = { imported: number; skipped: number; errors: string[] };

export function CsvImportDialog({
  title,
  description,
  headers,
  templateLabel,
  onTemplate,
  onImport,
  onClose,
}: {
  title: string;
  description: string;
  headers: string[];
  templateLabel: string;
  onTemplate: () => void;
  onImport: (rows: CsvRow[]) => Promise<ImportResult>;
  onClose: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rows, setRows] = useState<CsvRow[]>([]);
  const [filename, setFilename] = useState("");
  const [reading, setReading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const readFile = async (file?: File) => {
    if (!file) return;
    setReading(true);
    setError("");
    setResult(null);
    try {
      const parsed = parseCsv(await file.text());
      if (parsed.length === 0) throw new Error("This file has no data rows.");
      setRows(parsed);
      setFilename(file.name);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "We couldn't read that CSV.");
      setRows([]);
    } finally {
      setReading(false);
    }
  };

  const startImport = async () => {
    if (rows.length === 0) return;
    setImporting(true);
    setError("");
    try {
      setResult(await onImport(rows));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Import could not be completed.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/30 p-0 backdrop-blur-sm sm:items-center sm:p-5">
      <div className="max-h-[92dvh] w-full max-w-3xl overflow-y-auto rounded-t-[18px] border border-border bg-card shadow-2xl sm:rounded-[18px]">
        <div className="flex items-start justify-between border-b border-border px-6 py-5">
          <div>
            <div className="eyebrow text-muted-foreground">Bulk import</div>
            <h2 className="mt-1 font-serif text-xl font-bold">{title}</h2>
            <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">{description}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" aria-label="Close import dialog" data-testid="button-close-import">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-5 p-6">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <button type="button" onClick={() => inputRef.current?.click()} className="flex min-h-28 items-center gap-4 rounded-xl border border-dashed border-accent/60 bg-accent/5 px-5 text-left hover:bg-accent/10" data-testid="button-choose-csv">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground"><Upload className="h-5 w-5" /></span>
              <span><span className="block text-sm font-bold">{reading ? "Reading file…" : filename || "Choose a CSV file"}</span><span className="mt-1 block text-xs text-muted-foreground">{rows.length ? `${rows.length} rows ready to review` : "Use the template to keep column names consistent."}</span></span>
            </button>
            <button type="button" onClick={onTemplate} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-xs font-bold hover:border-accent hover:bg-accent/10" data-testid="button-download-import-template">
              <FileSpreadsheet className="h-4 w-4" />{templateLabel}
            </button>
          </div>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => void readFile(event.target.files?.[0])} />
          {error && <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-semibold text-destructive">{error}</div>}
          {rows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex items-center justify-between border-b border-border bg-muted/30 px-4 py-3"><span className="text-xs font-bold">Preview</span><span className="mono text-[10px] text-muted-foreground">First {Math.min(rows.length, 5)} of {rows.length}</span></div>
              <div className="overflow-x-auto"><table className="data-table w-full min-w-[620px] text-left"><thead><tr>{headers.slice(0, 6).map((header) => <th key={header} className="px-4 py-2">{header}</th>)}</tr></thead><tbody>{rows.slice(0, 5).map((row, index) => <tr key={index}>{headers.slice(0, 6).map((header) => <td key={header} className="max-w-[180px] truncate px-4 py-3 text-xs">{row[header] || "—"}</td>)}</tr>)}</tbody></table></div>
            </div>
          )}
          {result && <div className="rounded-lg border border-[#287668]/20 bg-[#e3f2ee] px-4 py-3 text-xs font-semibold text-[#287668]">Imported {result.imported} record{result.imported === 1 ? "" : "s"}. {result.skipped ? `${result.skipped} duplicate${result.skipped === 1 ? "" : "s"} skipped.` : "No duplicates found."}{result.errors.length ? ` ${result.errors.length} row${result.errors.length === 1 ? "" : "s"} need attention.` : ""}</div>}
          {result?.errors.length ? <div className="max-h-24 overflow-y-auto rounded-lg bg-muted/60 px-4 py-3 text-[11px] leading-5 text-muted-foreground">{result.errors.join(" · ")}</div> : null}
          <div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted">Close</button><button type="button" disabled={!rows.length || importing} onClick={() => void startImport()} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50" data-testid="button-import-csv">{importing ? "Importing…" : `Import ${rows.length || ""} records`}</button></div>
        </div>
      </div>
    </div>
  );
}