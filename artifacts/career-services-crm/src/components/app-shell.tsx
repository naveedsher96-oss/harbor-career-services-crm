import { Bell, BriefcaseBusiness, Building2, ChevronRight, FileBarChart, LayoutDashboard, Menu, Settings2, UsersRound, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';

const navItems = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/employers', label: 'Employers', icon: Building2 },
  { href: '/graduates', label: 'Graduates', icon: UsersRound },
  { href: '/jobs', label: 'Job bank', icon: BriefcaseBusiness },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pageName = location === '/' ? 'Overview' : location.slice(1).replace('-', ' ');

  return (
    <div className="noise min-h-[100dvh] bg-background text-foreground">
      <aside className="desktop-sidebar fixed inset-y-0 left-0 z-30 flex w-[248px] flex-col bg-sidebar text-sidebar-foreground">
        <div className="flex h-[92px] items-center gap-3 border-b border-sidebar-border px-7">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-[13px] bg-sidebar-primary text-sidebar-primary-foreground">
            <span className="absolute h-[2px] w-5 -translate-y-[5px] rounded bg-current" />
            <span className="absolute h-[2px] w-3 translate-y-[5px] rounded bg-current" />
            <span className="absolute h-3 w-[2px] -translate-x-[5px] rounded bg-current" />
          </div>
          <div>
            <div className="font-serif text-[15px] font-extrabold tracking-[-.03em] text-sidebar-accent-foreground">Harbor /</div>
            <div className="eyebrow mt-0.5 text-sidebar-foreground/55">Career services</div>
          </div>
        </div>
        <div className="px-4 pt-7">
          <div className="eyebrow px-3 text-sidebar-foreground/40">Workspace</div>
          <nav className="mt-3 space-y-1">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = href === '/' ? location === '/' : location.startsWith(href);
              return (
                <Link key={href} href={href} data-testid={`link-nav-${label.toLowerCase().replace(' ', '-')}`} onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold ${active ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-sidebar-foreground/65 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground'}`}>
                  <Icon className={`h-[17px] w-[17px] ${active ? 'text-sidebar-primary' : ''}`} strokeWidth={1.8} />
                  <span className="flex-1">{label}</span>
                  {active && <ChevronRight className="h-3.5 w-3.5 text-sidebar-primary" />}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="mt-auto p-4">
          <Link href="/settings" data-testid="link-nav-settings" className="flex items-center gap-3 rounded-[10px] px-3 py-2.5 text-[13px] font-semibold text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Settings2 className="h-[17px] w-[17px]" strokeWidth={1.8} /><span>Workspace settings</span>
          </Link>
          <div className="mt-5 flex items-center gap-3 rounded-[12px] border border-sidebar-border bg-sidebar-accent/50 p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dd9f62] text-[11px] font-bold text-[#273f43]">MC</div>
            <div className="min-w-0"><div className="truncate text-xs font-bold text-sidebar-accent-foreground">Maya Chen</div><div className="truncate text-[10px] text-sidebar-foreground/50">Healthcare pathways</div></div>
            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-sidebar-primary" />
          </div>
        </div>
      </aside>
      <header className="sticky top-0 z-20 flex h-[70px] items-center justify-between border-b border-border bg-background/95 px-5 backdrop-blur md:ml-[248px] md:px-9">
        <div className="flex items-center gap-3">
          <button type="button" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)} data-testid="button-toggle-mobile-nav" aria-label="Toggle navigation">
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="text-sm font-semibold capitalize text-foreground/70">{pageName}</div>
          <span className="hidden h-1 w-1 rounded-full bg-accent md:block" />
          <span className="hidden text-xs text-muted-foreground md:block">Private workspace</span>
        </div>
        <div className="flex items-center gap-3">
          <button type="button" className="relative rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-foreground" data-testid="button-notifications" aria-label="Notifications">
            <Bell className="h-[18px] w-[18px]" strokeWidth={1.8} /><span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
          </button>
          <div className="hidden h-5 w-px bg-border sm:block" />
          <div className="hidden text-right sm:block"><div className="text-xs font-semibold">Maya Chen</div><div className="text-[10px] text-muted-foreground">Career services manager</div></div>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dd9f62] text-[10px] font-bold text-[#273f43]">MC</div>
        </div>
      </header>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-sidebar md:hidden"><div className="flex h-full flex-col p-5 text-sidebar-foreground"><div className="mb-8 flex items-center justify-between"><span className="font-serif text-lg font-extrabold text-sidebar-accent-foreground">Harbor /</span><button type="button" onClick={() => setMobileOpen(false)} data-testid="button-close-mobile-nav"><X /></button></div>{navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} onClick={() => setMobileOpen(false)} className="flex items-center gap-3 border-b border-sidebar-border py-4 text-sm font-semibold" data-testid={`mobile-link-${label.toLowerCase().replace(' ', '-')}`}><Icon className="h-5 w-5 text-sidebar-primary" />{label}</Link>)}</div></div>}
      <main className="page-in min-h-[calc(100dvh-70px)] md:ml-[248px]">{children}</main>
    </div>
  );
}