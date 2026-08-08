import { cn } from "@/lib/utils";

export function Card({ className, ...props }) {
  return <div className={cn("rounded-xl bg-white shadow-sm ring-1 ring-navy-100", className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
  return <div className={cn("border-b border-navy-100 p-5", className)} {...props} />;
}

export function CardTitle({ className, ...props }) {
  return <h2 className={cn("font-semibold text-navy-900", className)} {...props} />;
}

export function CardBody({ className, ...props }) {
  return <div className={cn("p-5", className)} {...props} />;
}

export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="rounded-xl border border-dashed border-navy-200 bg-white p-12 text-center">
      {Icon && <Icon className="mx-auto h-6 w-6 text-navy-300" aria-hidden />}
      <h3 className="mt-3 font-semibold text-navy-900">{title}</h3>
      {description && <p className="mx-auto mt-1 max-w-sm text-sm text-navy-500">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
