import Link from "next/link";
import type { ReactNode } from "react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { label: string; href: string };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="card p-10 text-center">
      {icon && <div className="text-4xl mb-3">{icon}</div>}
      <h3 className="font-display text-lg font-semibold text-honeydew-800">
        {title}
      </h3>
      <p className="mt-1 text-sm text-honeydew-500 max-w-xs mx-auto">
        {description}
      </p>
      {action && (
        <Link href={action.href} className="btn-primary inline-block mt-4">
          {action.label}
        </Link>
      )}
    </div>
  );
}
