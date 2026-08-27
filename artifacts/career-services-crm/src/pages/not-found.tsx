import { AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-6 text-foreground">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-primary"><AlertCircle className="h-6 w-6" /></div>
        <div className="eyebrow mt-6 text-muted-foreground">Quiet corner</div>
        <h1 className="mt-2 font-serif text-3xl font-extrabold tracking-[-.05em]">That page isn’t on the desk<span className="text-accent">.</span></h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">The address may have changed, or this view hasn’t been added yet.</p>
        <Link href="/" className="mt-6 inline-flex rounded-lg bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90" data-testid="link-return-overview">Return to overview</Link>
      </div>
    </div>
  );
}
