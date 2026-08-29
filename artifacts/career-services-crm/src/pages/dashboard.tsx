import { ArrowUpRight, BriefcaseBusiness, Building2, CalendarClock, Check, CircleAlert, Mail, Plus, UsersRound } from 'lucide-react';
import { Link } from 'wouter';
import { useGetActivity, useGetDashboardSummary, useListPrograms } from '@workspace/api-client-react';
import { AppShell } from '@/components/app-shell';

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(value)) : '—';
const todayLabel = new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
const relative = (value: string) => {
  const diff = Math.round((Date.now() - new Date(value).getTime()) / 60000);
  if (diff < 60) return `${Math.max(diff, 1)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
};

function Metric({ label, value, note, icon: Icon, accent }: { label: string; value: number | string; note: string; icon: typeof Building2; accent?: string }) {
  return <div className="rounded-[14px] border border-border bg-card p-5 shadow-[0_3px_16px_hsl(198_30%_20%_/_0.035)]">
    <div className="flex items-start justify-between"><span className="eyebrow text-muted-foreground">{label}</span><span className={`rounded-lg p-2 ${accent ?? 'bg-secondary text-primary'}`}><Icon className="h-4 w-4" strokeWidth={1.8} /></span></div>
    <div className="mt-4 font-serif text-[34px] font-extrabold tracking-[-.06em]">{value}</div>
    <div className="mt-1 text-xs text-muted-foreground">{note}</div>
  </div>;
}

function DashboardSkeleton() {
  return <div className="space-y-5"><div className="skeleton h-24 rounded-[14px]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1, 2, 3, 4].map((item) => <div className="skeleton h-32 rounded-[14px]" key={item} />)}</div><div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]"><div className="skeleton h-80 rounded-[14px]" /><div className="skeleton h-80 rounded-[14px]" /></div></div>;
}

export default function Dashboard() {
  const summaryQuery = useGetDashboardSummary();
  const activityQuery = useGetActivity();
  const programsQuery = useListPrograms();
  const summary = summaryQuery.data;
  const activities = activityQuery.data ?? [];
  const programs = programsQuery.data ?? summary?.programs ?? [];

  return <AppShell><div className="mx-auto max-w-[1500px] px-5 py-7 md:px-9 md:py-9">
      <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div><div className="eyebrow mb-2 text-accent-foreground/70">{todayLabel}</div><h1 className="font-serif text-[32px] font-extrabold tracking-[-.055em] md:text-[40px]">Good morning, Naveed<span className="text-accent">.</span></h1><p className="mt-2 max-w-lg text-sm text-muted-foreground">Your relationship desk is in good shape. Here’s what deserves your attention today.</p></div>
      <div className="flex gap-2"><Link href="/employers" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2.5 text-xs font-bold hover:-translate-y-0.5 hover:border-accent" data-testid="link-add-employer"><Plus className="h-4 w-4" />Add employer</Link><Link href="/jobs" className="inline-flex items-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-xs font-bold text-primary-foreground hover:-translate-y-0.5 hover:bg-primary/90" data-testid="link-add-job"><Plus className="h-4 w-4" />Post a job</Link></div>
    </div>
    {summaryQuery.isLoading ? <DashboardSkeleton /> : summaryQuery.isError ? <div className="rounded-[14px] border border-destructive/30 bg-destructive/5 p-8 text-center"><CircleAlert className="mx-auto h-7 w-7 text-destructive" /><h2 className="mt-3 font-serif text-lg font-bold">The overview is taking a breather</h2><p className="mt-1 text-sm text-muted-foreground">We couldn’t load your workspace summary.</p><button type="button" onClick={() => summaryQuery.refetch()} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="button-retry-dashboard">Try again</button></div> : <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Employer relationships" value={summary?.employers ?? 0} note={`${summary?.activeEmployers ?? 0} active right now`} icon={Building2} />
        <Metric label="Open opportunities" value={summary?.openJobs ?? 0} note="Across all four programs" icon={BriefcaseBusiness} accent="bg-[#e3f2ee] text-[#287668]" />
        <Metric label="Sharing-ready graduates" value={summary?.optedInGraduates ?? 0} note="Consent is current" icon={UsersRound} accent="bg-[#f8e9dc] text-[#a75d31]" />
        <Metric label="Follow-ups due" value={summary?.followUpsDue ?? 0} note="Keep the loop warm" icon={CalendarClock} accent="bg-[#f4e3e1] text-[#a4473e]" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <section className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="eyebrow text-muted-foreground">Needs a human touch</div><h2 className="mt-1 font-serif text-lg font-bold">Priority opportunities</h2></div><Link href="/jobs" className="text-xs font-bold text-primary hover:text-accent-foreground" data-testid="link-view-all-jobs">View job bank <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
          <div className="divide-y divide-border">{(summary?.priorityJobs ?? []).length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No priority opportunities right now.</div> : summary?.priorityJobs.slice(0, 4).map((job) => <div className="group flex items-center gap-4 px-5 py-4 hover:bg-muted/40" key={job.id} data-testid={`row-priority-job-${job.id}`}><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-secondary text-sm font-bold text-primary">{job.employerName.slice(0, 1)}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-bold">{job.title}</div><div className="mt-1 flex flex-wrap gap-x-2 text-xs text-muted-foreground"><span>{job.employerName}</span><span className="text-border">/</span><span>{job.location}</span><span className="text-border">/</span><span>{job.schedule}</span></div></div><div className="hidden text-right sm:block"><div className="text-xs font-semibold">{job.applicants} applicants</div><div className="mono mt-1 text-[10px] text-muted-foreground">expires {formatDate(job.expiresDate)}</div></div><span className="h-2 w-2 rounded-full bg-accent" /></div>)}</div>
        </section>
        <section className="rounded-[14px] border border-border bg-card">
          <div className="border-b border-border px-5 py-4"><div className="eyebrow text-muted-foreground">Four programs, one desk</div><h2 className="mt-1 font-serif text-lg font-bold">Program pulse</h2></div>
          <div className="space-y-4 p-5">{programs.length === 0 ? <div className="text-sm text-muted-foreground">Program data will appear here.</div> : programs.map((program) => <div key={program.id} className="group" data-testid={`program-pulse-${program.id}`}><div className="mb-1.5 flex items-center justify-between text-xs"><span className="flex items-center gap-2 font-bold"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: program.color }} />{program.shortName}</span><span className="mono text-muted-foreground">{program.openJobCount} open jobs</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full" style={{ width: `${Math.min(100, 30 + program.openJobCount * 8)}%`, backgroundColor: program.color }} /></div><div className="mt-1.5 text-[11px] text-muted-foreground">{program.employerCount} employers · {program.graduateCount} graduates</div></div>)}</div>
          <div className="border-t border-border bg-muted/35 px-5 py-3 text-xs text-muted-foreground"><Link href="/graduates" className="font-bold text-primary" data-testid="link-program-graduates">See sharing-ready graduates <ArrowUpRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
        </section>
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_1.45fr]">
        <section className="rounded-[14px] border border-border bg-card p-5"><div className="flex items-center justify-between"><div><div className="eyebrow text-muted-foreground">This month</div><h2 className="mt-1 font-serif text-lg font-bold">Placement progress</h2></div><span className="rounded-full bg-[#e3f2ee] px-2.5 py-1 text-[11px] font-bold text-[#287668]">On track</span></div><div className="mt-7 flex items-end gap-5"><div className="font-serif text-[48px] font-extrabold leading-none tracking-[-.08em]">{summary?.placementsThisMonth ?? 0}</div><div className="pb-1 text-xs text-muted-foreground">graduates placed<br />this month</div></div><div className="mt-6 h-2 rounded-full bg-muted"><div className="h-full w-[68%] rounded-full bg-accent" /></div><div className="mt-2 flex justify-between text-[11px] text-muted-foreground"><span>68% of monthly goal</span><span className="mono">goal 12</span></div></section>
        <section className="rounded-[14px] border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="eyebrow text-muted-foreground">The paper trail</div><h2 className="mt-1 font-serif text-lg font-bold">Recent activity</h2></div><span className="rounded-full bg-muted px-2 py-1 text-[10px] font-bold text-muted-foreground">Live</span></div><div className="divide-y divide-border">{activityQuery.isLoading ? [1, 2, 3].map((item) => <div className="flex gap-3 p-4" key={item}><div className="skeleton h-8 w-8 rounded-full" /><div className="skeleton h-8 flex-1 rounded" /></div>) : activities.slice(0, 4).map((activity) => <div className="flex gap-3 px-5 py-3.5" key={activity.id} data-testid={`activity-${activity.id}`}><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">{activity.type === 'email' ? <Mail className="h-3.5 w-3.5 text-primary" /> : activity.type === 'job' ? <BriefcaseBusiness className="h-3.5 w-3.5 text-primary" /> : <Check className="h-3.5 w-3.5 text-primary" />}</div><div className="min-w-0 flex-1"><div className="text-xs font-semibold">{activity.title}</div><div className="mt-0.5 truncate text-[11px] text-muted-foreground">{activity.detail}</div></div><span className="mono whitespace-nowrap text-[10px] text-muted-foreground">{relative(activity.timestamp)}</span></div>)}</div></section>
      </div>
    </div>}
  </div></AppShell>;
}