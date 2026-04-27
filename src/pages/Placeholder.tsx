import { AppShell } from "@/components/AppShell";
import { Card } from "@/components/ui/card";

const Placeholder = ({ title, blurb }: { title: string; blurb: string }) => (
  <AppShell>
    <div className="container py-16 max-w-2xl">
      <h1 className="font-serif text-4xl font-semibold mb-3">{title}</h1>
      <p className="text-muted-foreground mb-8">{blurb}</p>
      <Card className="p-10 text-center border-dashed border-border shadow-none bg-muted/30">
        <p className="scripture text-lg">Coming next.</p>
        <p className="text-sm text-muted-foreground mt-2">
          This page is part of Stage 2 — recipients, covenant edit, year-end report, and settings.
        </p>
      </Card>
    </div>
  </AppShell>
);

export default Placeholder;
