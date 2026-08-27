import { Download, FileBarChart, ShieldCheck, UsersRound } from "lucide-react";
import { useState } from "react";
import { useListEmployers, useListGraduates, useListPrograms } from "@workspace/api-client-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-primitives";
import { downloadCsv } from "@/lib/csv";

type ReportKind = "graduates" | "employers";

export default function Reports() {
  const [kind, setKind] = useState<ReportKind>("graduates");
  const [programId, setProgramId] = useState<number | undefined>();
  const [visibility, setVisibility] = useState<"opted-in" | "needs-review" | "private" | undefined>();
  const [status, setStatus] = useState<"active" | "prospect" | "dormant" | undefined>();
  const programs = useListPrograms();
  const graduates = useListGraduates({ programId, visibility });
  const employers = useListEmployers({ programId });
  const graduateRows = graduates.data ?? [];
  const employerRows = (employers.data ?? []).filter((employer) => !status || employer.status === status);
  const count = kind === "graduates" ? graduateRows.length : employerRows.length;

  const download = () => {
    if (kind === "graduates") {
      downloadCsv(`graduates-report-${new Date().toISOString().slice(0, 10)}.csv`, graduateRows.map((graduate) => ({
        Name: graduate.name,
        Email: graduate.email,
        Phone: graduate.phone ?? "",
        Program: graduate.programName,
        Cohort: graduate.cohort,
        Location: graduate.location,
        Availability: graduate.availability,
        Skills: graduate.skills,
        Visibility: graduate.visibility,
        "Resume on file": graduate.resumeName ? "Yes" : "No",
        Placement: graduate.placementStatus,
      })));
    } else {
      downloadCsv(`employers-report-${new Date().toISOString().slice(0, 10)}.csv`, employerRows.map((employer) => ({
        Organization: employer.name,
        Type: employer.type,
        Location: employer.location,
        Programs: employer.programNames,
        Status: employer.status,
        Contact: employer.primaryContact ?? "",
        Email: employer.primaryEmail ?? "",
        "Open jobs": employer.openJobs,
        "Last contacted": employer.lastContacted ?? "",
        "Next follow-up": employer.nextFollowUp ?? "",
        Notes: employer.notes ?? "",
      })));
    }
  };

  return <AppShell><div className="mx-auto max-w-[1280px] px-5 py-7 md:px-9 md:py-9">
    <PageHeader eyebrow="Export center" title="Reports" description="Download a clean, filtered snapshot for outreach, placement reviews, or program updates." action={<button type="button" onClick={download} disabled={!count} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 disabled:opacity-50" data-testid="button-download-report"><Download className="h-4 w-4" />Download CSV</button>} />
    <div className="grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
      <section className="rounded-[14px] border border-border bg-card p-5">
        <div className="eyebrow text-muted-foreground">Choose a dataset</div>
        <div className="mt-4 grid gap-3">
          <button type="button" onClick={() => setKind("graduates")} className={`flex items-start gap-3 rounded-xl border p-4 text-left ${kind === "graduates" ? "border-accent bg-accent/10" : "border-border hover:bg-muted/40"}`} data-testid="button-report-graduates"><span className="rounded-lg bg-[#f8e9dc] p-2 text-[#a75d31]"><UsersRound className="h-4 w-4" /></span><span><span className="block text-sm font-bold">Graduate report</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Candidate contact, program, skills, consent, and placement details.</span></span></button>
          <button type="button" onClick={() => setKind("employers")} className={`flex items-start gap-3 rounded-xl border p-4 text-left ${kind === "employers" ? "border-accent bg-accent/10" : "border-border hover:bg-muted/40"}`} data-testid="button-report-employers"><span className="rounded-lg bg-secondary p-2 text-primary"><FileBarChart className="h-4 w-4" /></span><span><span className="block text-sm font-bold">Employer report</span><span className="mt-1 block text-xs leading-5 text-muted-foreground">Relationship status, program fit, contacts, jobs, and follow-up dates.</span></span></button>
        </div>
        <div className="mt-6 border-t border-border pt-5"><div className="eyebrow text-muted-foreground">Filters</div><div className="mt-3 space-y-3"><label className="block text-xs font-bold">Program<select value={programId ?? ""} onChange={(event) => setProgramId(event.target.value ? Number(event.target.value) : undefined)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-report-program"><option value="">All programs</option>{(programs.data ?? []).map((program) => <option value={program.id} key={program.id}>{program.name}</option>)}</select></label>{kind === "graduates" ? <label className="block text-xs font-bold">Consent visibility<select value={visibility ?? ""} onChange={(event) => setVisibility((event.target.value || undefined) as typeof visibility)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-report-visibility"><option value="">All visibility</option><option value="opted-in">Opted in</option><option value="needs-review">Needs review</option><option value="private">Private</option></select></label> : <label className="block text-xs font-bold">Relationship status<select value={status ?? ""} onChange={(event) => setStatus((event.target.value || undefined) as typeof status)} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none focus:border-accent" data-testid="select-report-status"><option value="">All statuses</option><option value="active">Active</option><option value="prospect">Prospect</option><option value="dormant">Dormant</option></select></label>}</div></div>
      </section>
      <section className="rounded-[14px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="eyebrow text-muted-foreground">Ready to export</div><h2 className="mt-1 font-serif text-lg font-bold">{kind === "graduates" ? "Graduate records" : "Employer records"}</h2></div><span className="mono rounded-full bg-muted px-2.5 py-1 text-[11px] font-bold">{count} rows</span></div>
        <div className="divide-y divide-border">{kind === "graduates" ? graduateRows.slice(0, 8).map((graduate) => <div key={graduate.id} className="flex items-center gap-3 px-5 py-3.5"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8e9dc] text-[10px] font-bold text-[#a75d31]">{graduate.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{graduate.name}</div><div className="mt-1 truncate text-[11px] text-muted-foreground">{graduate.programName} · {graduate.location}</div></div><div className="hidden items-center gap-1 text-[10px] font-bold text-[#287668] sm:flex"><ShieldCheck className="h-3.5 w-3.5" />{graduate.visibility === "opted-in" ? "Share-ready" : graduate.visibility.replace("-", " ")}</div></div>) : employerRows.slice(0, 8).map((employer) => <div key={employer.id} className="flex items-center gap-3 px-5 py-3.5"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary text-xs font-bold text-primary">{employer.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="truncate text-xs font-bold">{employer.name}</div><div className="mt-1 truncate text-[11px] text-muted-foreground">{employer.programNames.join(" · ") || "No program tagged"} · {employer.location}</div></div><span className="mono text-[10px] text-muted-foreground">{employer.openJobs} jobs</span></div>)}{count === 0 && <div className="p-14 text-center text-sm text-muted-foreground">No records match those filters.</div>}</div>
        <div className="border-t border-border bg-muted/30 px-5 py-4 text-xs text-muted-foreground">The download includes all {count} filtered record{count === 1 ? "" : "s"}, not just the preview above.</div>
      </section>
    </div>
  </div></AppShell>;
}