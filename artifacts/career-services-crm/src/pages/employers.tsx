import { Building2, Mail, MapPin, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetEmployer, useListEmployers, useListPrograms, useCreateEmployer, useUpdateEmployer, useDeleteEmployer, getGetEmployerQueryKey, getListEmployersQueryKey } from '@workspace/api-client-react';
import type { Employer, EmployerInput } from '@workspace/api-client-react';
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

function DeleteEmployerDialog({ employer, onClose }: { employer: Employer; onClose: () => void }) {
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteEmployer();
  const confirmDelete = () => deleteMutation.mutate({ id: employer.id }, {
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: getListEmployersQueryKey() }); toast({ title: 'Employer removed', description: `${employer.name} was deleted.` }); onClose(); },
    onError: (error) => toast({ variant: 'destructive', title: 'Could not delete employer', description: extractErrorMessage(error, 'Something went wrong. Please try again.') }),
  });
  return <AlertDialog open onOpenChange={(open) => !open && onClose()}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Remove {employer.name}?</AlertDialogTitle><AlertDialogDescription>This deletes the employer record and its program links. This can't be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel data-testid="button-cancel-delete-employer">Cancel</AlertDialogCancel><AlertDialogAction onClick={confirmDelete} disabled={deleteMutation.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" data-testid="button-confirm-delete-employer">{deleteMutation.isPending ? 'Deleting…' : 'Delete employer'}</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>;
}

function EmployerDialog({ employer, onClose }: { employer?: Employer; onClose: () => void }) {
  const queryClient = useQueryClient();
  const programsQuery = useListPrograms();
  const detailQuery = useGetEmployer(employer?.id ?? 0, { query: { enabled: Boolean(employer), queryKey: getGetEmployerQueryKey(employer?.id ?? 0) } });
  const createMutation = useCreateEmployer();
  const updateMutation = useUpdateEmployer();
  const source = detailQuery.data ?? employer;
  const [form, setForm] = useState<EmployerInput>({ name: '', type: 'Healthcare provider', location: '', website: '', status: 'prospect', primaryContact: '', primaryEmail: '', programIds: [], nextFollowUp: '', notes: '' });
  useEffect(() => { if (source) setForm({ name: source.name, type: source.type, location: source.location, website: source.website ?? '', status: source.status, primaryContact: source.primaryContact ?? '', primaryEmail: source.primaryEmail ?? '', programIds: source.programIds, nextFollowUp: source.nextFollowUp?.slice(0, 10) ?? '', notes: source.notes ?? '' }); }, [source]);
  const set = (key: keyof EmployerInput, value: string | number[]) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => { event.preventDefault(); const payload = { ...form, website: form.website || null, primaryContact: form.primaryContact || null, primaryEmail: form.primaryEmail || null, nextFollowUp: form.nextFollowUp || null, notes: form.notes || null }; const done = () => { queryClient.invalidateQueries({ queryKey: getListEmployersQueryKey() }); onClose(); }; employer ? updateMutation.mutate({ id: employer.id, data: payload }, { onSuccess: done }) : createMutation.mutate({ data: payload }, { onSuccess: done }); };
  const pending = createMutation.isPending || updateMutation.isPending;
  return <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/30 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-t-[18px] border border-border bg-card shadow-2xl sm:rounded-[18px]">
    <div className="flex items-start justify-between border-b border-border px-6 py-5"><div><div className="eyebrow text-muted-foreground">{employer ? 'Edit relationship' : 'New relationship'}</div><h2 className="mt-1 font-serif text-xl font-bold">{employer ? employer.name : 'Add an employer'}</h2></div><button type="button" onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" data-testid="button-close-employer-dialog"><X className="h-5 w-5" /></button></div>
    <form onSubmit={submit} className="space-y-5 p-6"><div className="grid gap-4 sm:grid-cols-2"><Field label="Organization name" value={form.name} required onChange={(value) => set('name', value)} testId="input-employer-name" /><Field label="Organization type" value={form.type} onChange={(value) => set('type', value)} testId="input-employer-type" /><Field label="City / region" value={form.location} onChange={(value) => set('location', value)} testId="input-employer-location" /><Field label="Website" value={form.website ?? ''} onChange={(value) => set('website', value)} testId="input-employer-website" /></div><div className="grid gap-4 sm:grid-cols-2"><Field label="Primary contact" value={form.primaryContact ?? ''} onChange={(value) => set('primaryContact', value)} testId="input-employer-contact" /><Field label="Contact email" type="email" value={form.primaryEmail ?? ''} onChange={(value) => set('primaryEmail', value)} testId="input-employer-email" /><Field label="Next follow-up" type="date" value={form.nextFollowUp ?? ''} onChange={(value) => set('nextFollowUp', value)} testId="input-employer-follow-up" /><label className="space-y-1.5 text-xs font-bold"><span>Status</span><select value={form.status} onChange={(event) => set('status', event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-employer-status"><option value="active">Active</option><option value="prospect">Prospect</option><option value="dormant">Dormant</option></select></label></div><ProgramPicker selected={form.programIds} programs={programsQuery.data ?? []} onChange={(ids) => set('programIds', ids)} /><label className="space-y-1.5 text-xs font-bold"><span>Relationship notes</span><textarea value={form.notes ?? ''} onChange={(event) => set('notes', event.target.value)} className="min-h-20 w-full rounded-lg border border-input bg-background p-3 text-sm font-normal outline-none focus:border-accent" placeholder="Context worth carrying forward..." data-testid="textarea-employer-notes" /></label><div className="flex justify-end gap-2 border-t border-border pt-4"><button type="button" onClick={onClose} className="rounded-lg px-4 py-2.5 text-xs font-bold text-muted-foreground hover:bg-muted" data-testid="button-cancel-employer">Cancel</button><SaveButton pending={pending}>{employer ? 'Save employer' : 'Add employer'}</SaveButton></div></form>
  </div></div>;
}
function Field({ label, value, onChange, testId, type = 'text', required }: { label: string; value: string; onChange: (value: string) => void; testId: string; type?: string; required?: boolean }) { return <label className="space-y-1.5 text-xs font-bold"><span>{label}</span><input required={required} type={type} value={value} onChange={(event) => onChange(event.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent focus:ring-2 focus:ring-accent/15" data-testid={testId} /></label>; }
function ProgramPicker({ selected, programs, onChange }: { selected: number[]; programs: { id: number; shortName: string; color: string }[]; onChange: (ids: number[]) => void }) { return <div><div className="mb-2 text-xs font-bold">Programs connected</div><div className="flex flex-wrap gap-2">{programs.map((program) => <label key={program.id} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold ${selected.includes(program.id) ? 'border-accent bg-accent/10' : 'border-border bg-background'}`}><input type="checkbox" checked={selected.includes(program.id)} onChange={() => onChange(selected.includes(program.id) ? selected.filter((id) => id !== program.id) : [...selected, program.id])} className="accent-[#4a9f8d]" data-testid={`checkbox-employer-program-${program.id}`} /><span className="h-2 w-2 rounded-full" style={{ backgroundColor: program.color }} />{program.shortName}</label>)}</div></div>; }

export default function Employers() {
  const [search, setSearch] = useState('');
  const [programId, setProgramId] = useState<number | undefined>();
  const [editing, setEditing] = useState<Employer | undefined>();
  const [deleting, setDeleting] = useState<Employer | undefined>();
  const [dialog, setDialog] = useState(false);
  const [importDialog, setImportDialog] = useState(false);
  const query = useListEmployers({ search: search || undefined, programId });
  const programsQuery = useListPrograms();
  const client = useQueryClient();
  const importMutation = useCreateEmployer();
  const employers = query.data ?? [];
  const importEmployers = async (rows: CsvRow[]) => {
    let imported = 0;
    let skipped = 0;
    const errors: string[] = [];
    const existing = new Set(employers.map((employer) => employer.name.trim().toLowerCase()));
    const programRows = programsQuery.data ?? [];
    for (const [index, row] of rows.entries()) {
      const name = row.name || row.organization || row.employer;
      if (!name || !row.location) {
        errors.push(`Row ${index + 2}: name and location are required.`);
        continue;
      }
      if (existing.has(name.trim().toLowerCase())) {
        skipped += 1;
        continue;
      }
      const programText = row.programs || row.program || "";
      const programIds = programRows.filter((program) => programText.toLowerCase().split(/[|;]/).some((value) => value.trim() === program.name.toLowerCase() || value.trim() === program.shortName.toLowerCase())).map((program) => program.id);
      const rawStatus = (row.status || "prospect").toLowerCase();
      const status = (["active", "prospect", "dormant"] as const).includes(rawStatus as "active" | "prospect" | "dormant") ? rawStatus as EmployerInput["status"] : "prospect";
      const payload: EmployerInput = {
        name,
        type: row.type || "Healthcare provider",
        location: row.location,
        website: row.website || null,
        status,
        primaryContact: row.contact || row.primarycontact || null,
        primaryEmail: row.email || row.primaryemail || null,
        programIds,
        nextFollowUp: row["next follow-up"] || row.nextfollowup || null,
        notes: row.notes || null,
      };
      await new Promise<void>((resolve) => importMutation.mutate({ data: payload }, {
        onSuccess: () => { imported += 1; existing.add(name.trim().toLowerCase()); resolve(); },
        onError: () => { errors.push(`Row ${index + 2}: could not save ${name}.`); resolve(); },
      }));
    }
    await client.invalidateQueries({ queryKey: getListEmployersQueryKey() });
    return { imported, skipped, errors };
  };
  return <AppShell><div className="mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9"><PageHeader eyebrow="Relationship directory" title="Employers" description="A considered record of every relationship — who is warm, who needs a nudge, and where there’s room to help." action={<div className="flex flex-wrap gap-2"><button type="button" onClick={() => setImportDialog(true)} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-bold hover:border-accent hover:bg-accent/10" data-testid="button-import-employers">Import CSV</button><button type="button" onClick={() => { setEditing(undefined); setDialog(true); }} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5" data-testid="button-new-employer"><Plus className="h-4 w-4" />Add employer</button></div>} />
    <div className="mb-4 flex flex-col gap-3 rounded-[14px] border border-border bg-card p-3 md:flex-row"><div className="min-w-0 flex-1"><SearchBox value={search} onChange={setSearch} placeholder="Search employers, contacts, or locations" testId="input-search-employers" /></div><select value={programId ?? ''} onChange={(event) => setProgramId(event.target.value ? Number(event.target.value) : undefined)} className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-accent" data-testid="select-filter-employer-program"><option value="">All programs</option>{(programsQuery.data ?? []).map((program) => <option value={program.id} key={program.id}>{program.shortName}</option>)}</select><div className="flex items-center px-2 text-xs text-muted-foreground">{employers.length} records</div></div>
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">{query.isLoading ? <LoadingRows /> : query.isError ? <ErrorState retry={() => query.refetch()} /> : employers.length === 0 ? <div className="p-16 text-center"><Building2 className="mx-auto h-8 w-8 text-accent" /><h2 className="mt-4 font-serif text-lg font-bold">No relationships in this view</h2><p className="mt-1 text-sm text-muted-foreground">Try a different search or add your first employer.</p><button type="button" onClick={() => setDialog(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="button-empty-add-employer">Add employer</button></div> : <div className="overflow-x-auto"><table className="data-table w-full min-w-[850px] text-left"><thead><tr><th className="px-5 py-3">Organization</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Programs</th><th className="px-4 py-3">Open jobs</th><th className="px-4 py-3">Next follow-up</th><th className="px-4 py-3">Status</th><th className="w-12 px-2" /></tr></thead><tbody>{employers.map((employer) => <tr key={employer.id} data-testid={`row-employer-${employer.id}`}><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-secondary text-sm font-bold text-primary">{employer.name.slice(0, 1)}</div><div><div className="text-sm font-bold">{employer.name}</div><div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="h-3 w-3" />{employer.location} <span className="mx-1 text-border">/</span>{employer.type}</div></div></div></td><td className="px-4 py-4"><div className="text-xs font-semibold">{employer.primaryContact || 'No contact yet'}</div>{employer.primaryEmail && <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Mail className="h-3 w-3" />{employer.primaryEmail}</div>}</td><td className="px-4 py-4"><div className="flex max-w-[150px] flex-wrap gap-1">{employer.programNames.map((name) => <span className="rounded bg-muted px-1.5 py-1 text-[10px] font-bold text-muted-foreground" key={name}>{name}</span>)}</div></td><td className="px-4 py-4"><span className="mono text-sm font-medium">{employer.openJobs}</span></td><td className="px-4 py-4"><span className={`text-xs font-semibold ${employer.nextFollowUp && new Date(employer.nextFollowUp) < new Date() ? 'text-[#a4473e]' : ''}`}>{employer.nextFollowUp ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(employer.nextFollowUp)) : '—'}</span></td><td className="px-4 py-4"><StatusPill value={employer.status} /></td><td className="px-2 py-4"><div className="flex items-center gap-1"><button type="button" onClick={() => { setEditing(employer); setDialog(true); }} className="rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary" data-testid={`button-edit-employer-${employer.id}`} aria-label={`Edit ${employer.name}`}><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setDeleting(employer)} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" data-testid={`button-delete-employer-${employer.id}`} aria-label={`Delete ${employer.name}`}><Trash2 className="h-3.5 w-3.5" /></button></div></td></tr>)}</tbody></table></div>}</div>
    {dialog && <EmployerDialog employer={editing} onClose={() => setDialog(false)} />}
    {deleting && <DeleteEmployerDialog employer={deleting} onClose={() => setDeleting(undefined)} />}
    {importDialog && <CsvImportDialog title="Import employers" description="Add multiple employer records at once. Existing organizations with the same name are skipped, and each row is matched to the programs you already use." headers={['name', 'type', 'location', 'website', 'contact', 'email', 'programs', 'status', 'next follow-up', 'notes']} templateLabel="Download template" onTemplate={() => downloadCsvTemplate('employers-template.csv', ['name', 'type', 'location', 'website', 'contact', 'email', 'programs', 'status', 'next follow-up', 'notes'], { name: 'Northside Pharmacy', type: 'Independent pharmacy', location: 'Austin, TX', website: '', contact: 'Hiring contact', email: 'contact@example.com', programs: 'Pharmacy', status: 'prospect', 'next follow-up': '2026-09-01', notes: '' })} onImport={importEmployers} onClose={() => setImportDialog(false)} />}
  </div></AppShell>;
}