import { AlertCircle, Check, Loader2, Search } from 'lucide-react';
import type { ReactNode } from 'react';

export function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="eyebrow mb-2 text-accent-foreground/70">{eyebrow}</div><h1 className="font-serif text-[32px] font-extrabold tracking-[-.055em]">{title}<span className="text-accent">.</span></h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p></div>{action}</div>;
}
export function SearchBox({ value, onChange, placeholder, testId }: { value: string; onChange: (value: string) => void; placeholder: string; testId: string }) {
  return <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} type="search" className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-accent focus:ring-2 focus:ring-accent/20" data-testid={testId} /></div>;
}
export function StatusPill({ value }: { value: string }) {
  const tone = value === 'active' || value === 'open' || value === 'opted-in' || value === 'placed' ? 'bg-[#e3f2ee] text-[#287668]' : value === 'prospect' || value === 'shared' || value === 'interviewing' || value === 'needs-review' ? 'bg-[#f8e9dc] text-[#a75d31]' : value === 'filled' ? 'bg-secondary text-primary' : 'bg-muted text-muted-foreground';
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-bold capitalize ${tone}`} data-testid={`status-${value}`}>{value.replace('-', ' ')}</span>;
}
export function LoadingRows({ count = 5 }: { count?: number }) {
  return <div className="space-y-2 p-4">{Array.from({ length: count }, (_, index) => <div key={index} className="skeleton h-12 rounded-lg" />)}</div>;
}
export function ErrorState({ retry }: { retry: () => void }) {
  return <div className="p-12 text-center"><AlertCircle className="mx-auto h-7 w-7 text-destructive" /><h2 className="mt-3 font-serif font-bold">Something didn’t make it through</h2><p className="mt-1 text-sm text-muted-foreground">Try refreshing this view.</p><button type="button" onClick={retry} className="mt-4 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground" data-testid="button-retry">Retry</button></div>;
}
export function SaveButton({ pending, children = 'Save changes' }: { pending: boolean; children?: ReactNode }) {
  return <button disabled={pending} type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60" data-testid="button-save">{pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{pending ? 'Saving' : children}{!pending && <Check className="h-3.5 w-3.5" />}</button>;
}