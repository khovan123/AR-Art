import type { LucideIcon } from "lucide-react";

export interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <article className="rounded-3xl border border-border bg-card/70 p-6 shadow-sm backdrop-blur">
      <div className="mb-5 flex size-11 items-center justify-center rounded-2xl bg-secondary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}
