import { MapPin, Pencil, Plus, ShieldCheck, Trash2, UsersRound, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateGraduate, useListGraduates, useListPrograms, useUpdateGraduate, useDeleteGraduate, getListGraduatesQueryKey } from '@workspace/api-client-react';
import type { Graduate, GraduateInput } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';
import { ErrorState, LoadingRows, PageHeader, SaveButton, SearchBox, StatusPill } from '@/components/page-primitives';
import { CsvImportDialog } from '@/components/csv-import-dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import type { CsvRow } from '@/lib/csv';
import { downloadCsvTemplate } from '@/lib/csv';

function extractErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const separatorIndex = error.message.indexOf(': ');
    return separatorIndex >= 0 ? error.message.slice(separatorIndex + 2) : error.message;
  }
  return fallback;
}

function DeleteGraduateDialog({ graduate, onClose }: { graduate: Graduate; onClose: () => void }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteGraduate();
  const confirmDelete = () => deleteMutation.mutate({ id: graduate.id }, {
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListGraduatesQueryKey() }); toast({ title: 'Graduate removed', description: `${graduate.name} was deleted.` }); onClose(); },
    onError: (error) => toast({ variant: 'destructive', title: 'Could not delete graduate', description: extractErrorMessage(error, 'Something went wrong. Please try again.') }),
  });
  return <AlertDialog open onOpenChange={(open) => !open && onClose()}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove {graduate.name}?</AlertDialogTitle><AlertDialogDescription>This deletes the graduate record, including consent visibility and skills. This can't be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel data-testid="button-cancel-delete-graduate">Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-graduate">{deleteMutation.isPending ? 'Deleting…' : 'Delete graduate'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function GraduateDialog({ graduate, onClose }: { graduate?: Graduate; onClose: () => void }) {
  const client = useQueryClient();
  const programs = useListPrograms();
  const create = useCreateGraduate();
  const update = useUpdateGraduate();
  const [form, setForm] = useState<GraduateInput>({ name: '', email: '', phone: '', programId: 0, cohort: '2024', location: '', availability: 'Open to opportunities', skills: [], visibility: 'needs-review', placementStatus: 'seeking' });
  useEffect(() => { if (graduate) setForm({ name: graduate.name, email: graduate.email, phone: graduate.phone ?? '', programId: graduate.programId, cohort: graduate.cohort, location: graduate.location, availability: graduate.availability, skills: graduate.skills, visibility: graduate.visibility, placementStatus: graduate.placementStatus }); }, [graduate]);
  const set = (key: keyof GraduateInput, value: string | number | string[]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); const payload = { ...form, phone: form.phone || null }; const done = () => { client.invalidateQueries({ queryKey: getListGraduatesQueryKey() }); onClose(); }; graduate ? update.mutate({ id: graduate.id, data: payload }, { onSuccess: done }) : create.mutate({ data: payload }, { onSuccess: done }); };
  const pending = create.isPending || update.isPending;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[18px] border border-border bg-card shadow-2xl sm:rounded-[18px]"><div className="flex items-start justify-between border-b border-border px-6 py-5"><div><div className="eyebrow text-muted-foreground">{graduate ? 'Edit graduate record' : 'New graduate record'}</div><h2 className="mt-1 font-serif text-xl font-bold">{graduate ? graduate.name : 'Add a graduate'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" data-testid="button-close-graduate-dialog"><X className="h-5 w-5" /></button></div><form onSubmit={submit} className="space-y-5 p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Full name" required value={form.name} onChange={(value) => set('name', value)} testId="input-graduate-name" /><Field label="Email" required type="email" value={form.email} onChange={(value) => set('email', value)} testId="input-graduate-email" /><Field label="Phone" value={form.phone ?? ''} onChange={(value) => set('phone', value)} testId="input-graduate-phone" /><Field label="City / region" value={form.location} onChange={(value) => set('location', value)} testId="input-graduate-location" /><label className="space-y-1.5 text-xs font-bold"><span>Program</span><select required value={form.programId || ''} onChange={(event) => set('programId', Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-graduate-program"><option value="">Select a program</option>{(programs.data ?? []).map((program) => <option value={program.id} key={program.id}>{program.name}</option>)}</select></label><Field label="Cohort" value={form.cohort} onChange={(value) => set('cohort', value)} testId="input-graduate-cohort" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Availability" value={form.availability} onChange={(value) => set('availability', value)} testId="input-graduate-availability" /><Field label="Skills (comma separated)" value={form.skills.join(', ')} onChange={(value) => set('skills', value.split(',').map((skill) => skill.trim()).filter(Boolean))} testId="input-graduate-skills" /><label className="space-y-1.5 text-xs font-bold"><span>Consent visibility</span><select value={form.visibility} onChange={(event) => set('visibility', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-graduate-visibility"><option value="opted-in">Opted in</option><option value="needs-review">Needs review</option><option value="private">Private</option></select></label><label className="space-y-1.5 text-xs font-bold"><span>Placement status</span><select value={form.placementStatus} onChange={(event) => set('placementStatus', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-graduate-placement"><option value="seeking">Seeking</option><option value="interviewing">Interviewing</option><option value="placed">Placed</option><option value="not-seeking">Not seeking</option></select></label></div><div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted" data-testid="button-cancel-graduate">Cancel</button><SaveButton pending={pending}>{graduate ? 'Save graduate' : 'Add graduate'}</SaveButton></div></form></div></div>;
}
function Field({ label, value, onChange, testId, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; testId: string; type?: string; required?: boolean }) { return <label className="space-y-1.5 text-xs font-bold"><span>{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" data-testid={testId} /></label>; }

export default function Graduates() {
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState<number | undefined>();
  const [visibility, setVisibility] = useState<string | undefined>();
  const [editing, setEditing] = useState<Graduate>();
  const [deleting, setDeleting] = useState<Graduate>();
  const [dialog, setDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const query = useListGraduates({ search: search || undefined, programId, visibility: visibility as 'opted-in' | 'needs-review' | 'private' | undefined });
  const programs = useListPrograms();
  const client = useQueryClient();
  const importMutation = useCreateGraduate();
  const graduates = query.data ?? [];
  const importGraduates = async (rows: CsvRow[]) => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const existing = new Set(graduates.map((graduate) => graduate.email.trim().toLowerCase()));
    const programRows = programs.data ?? [];
    for (const [index, row] of rows.entries()) {
      const name = row.name || row.fullname;
      const email = row.email;
      const programText = row.program || row.programs || "";
      const program = programRows.find((item) => item.name.toLowerCase() === programText.toLowerCase() || item.shortName.toLowerCase() === programText.toLowerCase());
      if (!name || !email || !program) {
        errors.push(`Row ${index + 2}: name, email, and a matching program are required.`);
        continue;
      }
      if (existing.has(email.trim().toLowerCase())) {
        skipped += 1;
        continue;
      }
      const rawVisibility = (row.visibility || "needs-review").toLowerCase();
      const visibilityValue = (["opted-in", "needs-review", "private"] as const).includes(rawVisibility as "opted-in" | "needs-review" | "private") ? rawVisibility as GraduateInput["visibility"] : "needs-review";
      const rawPlacement = (row.placement || row.placementstatus || "seeking").toLowerCase();
      const placementStatus = (["seeking", "interviewing", "placed", "not-seeking"] as const).includes(rawPlacement as "seeking" | "interviewing" | "placed" | "not-seeking") ? rawPlacement as GraduateInput["placementStatus"] : "seeking";
      const payload: GraduateInput = {
        name,
        email,
        phone: row.phone || null,
        programId: program.id,
        cohort: row.cohort || "2026",
        location: row.location || "",
        availability: row.availability || "Open to opportunities",
        skills: (row.skills || "").split(/[|;]/).map((skill) => skill.trim()).filter(Boolean),
        visibility: visibilityValue,
        placementStatus,
      };
      await new Promise<void>((resolve) => importMutation.mutate({ data: payload }, {
        onSuccess: () => { imported += 1; existing.add(email.trim().toLowerCase()); resolve(); },
        onError: () => { errors.push(`Row ${index + 2}: could not save ${name}.`); resolve(); },
      }));
    }
    await client.invalidateQueries({ queryKey: getListGraduatesQueryKey() });
    return { imported, skipped, errors };
  };
  return <AppShell><div className="mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9"><PageHeader eyebrow="Graduate directory" title="Graduates" description="Keep consent visible, skills current, and the next right opportunity within easy reach." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => setImportDialog(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-bold hover:border-accent hover:bg-accent/10" data-testid="button-import-graduates">Import CSV</button><button type="button" onClick={() => { setEditing(undefined); setDialog(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5" data-testid="button-new-graduate"><Plus className="h-4 w-4" />Add graduate</button></div>} /><div className="mb-4 flex flex-col gap-3 rounded-[14px] border border-border bg-card p-3 md:flex-row"><div className="min-w-0 flex-1"><SearchBox value={search} onChange={setSearch} placeholder="Search by name, skill, or location" testId="input-search-graduates" /></div><select value={programId ?? ''} onChange={(event) => setProgramId(event.target.value ? Number(event.target.value) : undefined)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="select-filter-graduate-program"><option value="">All programs</option>{(programs.data ?? []).map((program) => <option value={program.id} key={program.id}>{program.shortName}</option>)}</select><select value={visibility ?? ''} onChange={(event) => setVisibility(event.target.value || undefined)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="select-filter-graduate-visibility"><option value="">All visibility</option><option value="opted-in">Opted in</option><option value="needs-review">Needs review</option><option value="private">Private</option></select><div className="flex items-center px-2 text-xs text-muted-foreground">{graduates.length} records</div></div><div className="overflow-hidden rounded-[14px] border border-border bg-card">{query.isLoading ? <LoadingRows /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : graduates.length === 0 ? <div className="p-16 text-center"><UsersRound className="mx-auto h-8 w-8 text-accent" /><h2 className="mt-4 font-serif text-lg font-bold">No graduates in this view</h2><p className="mt-1 text-sm text-muted-foreground">Try adjusting your filters or add a new graduate record.</p><button type="button" onClick={() => setDialog(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="button-empty-add-graduate">Add graduate</button></div> : <div className="overflow-x-auto"><table className="data-table w-full min-w-[980px] text-left"><thead><tr><th className="px-5 py-3">Graduate</th><th className="px-4 py-3">Program</th><th className="px-4 py-3">Skills</th><th className="px-4 py-3">Availability</th><th className="px-4 py-3">Visibility</th><th className="px-4 py-3">Placement</th><th className="w-12 px-2" /></tr></thead><tbody>{graduates.map((graduate) => <tr key={graduate.id} data-testid={`row-graduate-${graduate.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#f8e9dc] text-xs font-bold text-[#a75d31]">{graduate.name.split(' ').map((part) => part[0]).slice(0, 2).join('')}</div><div><div className="text-sm font-bold">{graduate.name}</div><div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{graduate.location} <span className="mx-1 text-border">/</span>Class of {graduate.cohort}</div></div></div></td><td className="px-4 py-4"><span className="rounded bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">{graduate.programName}</span></td><td className="max-w-[220px] px-4 py-4"><div className="flex flex-wrap gap-1">{graduate.skills.slice(0, 3).map((skill) => <span key={skill} className="rounded bg-secondary px-1.5 py-1 text-[10px] font-medium text-primary">{skill}</span>)}</div></td><td className="px-4 py-4 text-xs text-muted-foreground">{graduate.availability}</td><td className="px-4 py-4"><div className="flex items-center gap-1.5">{graduate.visibility === 'opted-in' && <ShieldCheck className="h-3.5 w-3.5 text-[#287668]" />}<StatusPill value={graduate.visibility} /></div></td><td className="px-4 py-4"><StatusPill value={graduate.placementStatus} /></td><td className="px-2 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => { setEditing(graduate); setDialog(true); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" data-testid={`button-edit-graduate-${graduate.id}`} aria-label={`Edit ${graduate.name}`}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDeleting(graduate)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid={`button-delete-graduate-${graduate.id}`} aria-label={`Delete ${graduate.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table></div>}</div>{dialog && <GraduateDialog graduate={editing} onClose={() => setDialog(false)} />}{deleting && <DeleteGraduateDialog graduate={deleting} onClose={() => setDeleting(undefined)} />}{importDialog && <CsvImportDialog title="Import graduates" description="Bring in a candidate list from a spreadsheet. Existing records with the same email are skipped, and visibility stays explicit so private profiles never slip into sharing." headers={['name', 'email', 'phone', 'program', 'cohort', 'location', 'availability', 'skills', 'visibility', 'placement']} templateLabel="Download template" onTemplate={() => downloadCsvTemplate('graduates-template.csv', ['name', 'email', 'phone', 'program', 'cohort', 'location', 'availability', 'skills', 'visibility', 'placement'], { name: 'Avery Johnson', email: 'avery@example.com', phone: '', program: 'Pharmacy', cohort: '2026', location: 'Austin, TX', availability: 'Immediately', skills: 'PCTB certified|Patient service', visibility: 'needs-review', placement: 'seeking' })} onImport={importGraduates} onClose={() => setImportDialog(false)} />}</div></AppShell>;
}