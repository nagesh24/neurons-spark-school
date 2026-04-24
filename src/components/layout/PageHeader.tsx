import { ReactNode } from "react";

export function PageHeader({
  title, description, actions, icon: Icon,
}: { title: string; description?: string; actions?: ReactNode; icon?: any }) {
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div className="flex items-start gap-3">
        {Icon && (
          <div className="h-11 w-11 rounded-xl gradient-primary shadow-glow flex items-center justify-center shrink-0">
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
        )}
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}
